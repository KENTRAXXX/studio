
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser, useCollection, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, doc, updateDoc } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  Users,
  ShieldCheck,
  Search,
  CheckCircle,
  XCircle,
  Eye,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type UserProfile = {
  id: string;
  email: string;
  planTier: 'MERCHANT' | 'MOGUL' | 'SCALER' | 'SELLER' | 'ENTERPRISE';
  status: 'pending_review' | 'approved' | 'rejected';
  isDisabled?: boolean;
};

const getStatusBadgeVariant = (status: UserProfile['status'] | 'disabled') => {
  switch (status) {
    case 'approved':
      return 'bg-green-500/20 text-green-400 border-green-500/50';
    case 'pending_review':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    case 'rejected':
      return 'bg-red-500/20 text-red-400 border-red-500/50';
    case 'disabled':
       return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getPlanTierBadgeVariant = (planTier: UserProfile['planTier']) => {
    switch (planTier) {
        case 'MOGUL':
        case 'ENTERPRISE':
            return 'bg-primary/20 text-primary border-primary/50';
        case 'SELLER':
            return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
        default:
            return 'bg-secondary text-secondary-foreground';
    }
}

export default function UserManagementPage() {
  const { user: adminUser, loading: adminLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const usersRef = firestore ? query(collection(firestore, 'users')) : null;
  const { data: users, loading: usersLoading } = useCollection<UserProfile>(usersRef);

  useEffect(() => {
    if (!adminLoading && !adminUser) {
      router.push('/dashboard');
    }
  }, [adminUser, adminLoading, router]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users
      .filter(
        (user) =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter((user) => tierFilter === 'all' || user.planTier === tierFilter);
  }, [users, searchTerm, tierFilter]);
  
  const handleUpdateStatus = async (userId: string, newStatus: Partial<UserProfile>) => {
      if (!firestore) return;
      setProcessingId(userId);
      try {
          const userDocRef = doc(firestore, 'users', userId);
          await updateDoc(userDocRef, newStatus);
          toast({ title: 'Success', description: `User status updated successfully.` });
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error', description: error.message });
      } finally {
          setProcessingId(null);
      }
  }


  if (adminLoading || usersLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline text-primary flex items-center gap-2">
        <Users /> User Management
      </h1>

      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Search, filter, and manage all users on the SOMA platform.
          </CardDescription>
          <div className="flex flex-col md:flex-row gap-4 pt-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search by email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by tier" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="MERCHANT">Merchant</SelectItem>
                    <SelectItem value="MOGUL">Mogul</SelectItem>
                    <SelectItem value="SCALER">Scaler</SelectItem>
                    <SelectItem value="SELLER">Seller</SelectItem>
                    <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.email}</div>
                      <div className="text-xs text-muted-foreground font-mono">{user.id}</div>
                    </TableCell>
                    <TableCell>
                       <Badge variant="outline" className={cn(getPlanTierBadgeVariant(user.planTier))}>
                            {user.planTier}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline" className={cn(getStatusBadgeVariant(user.isDisabled ? 'disabled' : user.status))}>
                            {user.isDisabled ? 'Disabled' : user.status.replace('_', ' ')}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                        {processingId === user.id ? <Loader2 className="animate-spin ml-auto" /> : (
                            <>
                                <Button asChild variant="ghost" size="icon" title="View Storefront">
                                    <Link href={`/store/${user.id}`} target="_blank">
                                        <Eye className="h-4 w-4"/>
                                    </Link>
                                </Button>
                                {user.planTier === 'SELLER' && user.status === 'pending_review' && (
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleUpdateStatus(user.id, { status: 'approved' })}>
                                        <CheckCircle className="mr-2 h-4 w-4" /> Approve
                                    </Button>
                                )}
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleUpdateStatus(user.id, { isDisabled: !user.isDisabled })}
                                >
                                    <XCircle className="mr-2 h-4 w-4"/> {user.isDisabled ? 'Enable' : 'Disable'}
                                </Button>
                            </>
                        )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
