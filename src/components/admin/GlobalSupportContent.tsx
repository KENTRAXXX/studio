
'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useUserProfile, useMemoFirebase } from '@/firebase';
import { collection, collectionGroup, query, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
    Loader2, 
    Search, 
    Store, 
    MessageCircle, 
    ShieldCheck,
    ArrowUpRight,
    Filter,
    Headset
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SupportTicket } from '@/lib/types';

type StoreData = {
    userId: string;
    storeName: string;
};

export function GlobalSupportContent() {
    const firestore = useFirestore();
    const { userProfile, loading: profileLoading } = useUserProfile();

    const [searchTerm, setSearchTerm] = useState('');
    const [storeFilter, setStoreFilter] = useState('all');

    const storesQ = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'stores'), limit(500));
    }, [firestore]);
    const { data: stores, isLoading: storesLoading } = useCollection<StoreData>(storesQ);

    const ticketsQ = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collectionGroup(firestore, 'supportTickets'), orderBy('createdAt', 'desc'), limit(100));
    }, [firestore]);
    const { data: tickets, isLoading: ticketsLoading } = useCollection<SupportTicket>(ticketsQ);

    const filteredTickets = useMemo(() => {
        if (!tickets) return [];
        return tickets.filter(t => {
            const matchesSearch = t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 t.id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStore = storeFilter === 'all' || t.storeId === storeFilter;
            return matchesSearch && matchesStore;
        });
    }, [tickets, searchTerm, storeFilter]);

    const storesMap = useMemo(() => {
        if (!stores) return new Map();
        return new Map(stores.map(s => [s.userId, s.storeName]));
    }, [stores]);

    if (profileLoading || storesLoading || ticketsLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20 p-4">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline text-primary flex items-center gap-3">
                        <Headset className="h-8 w-8" />
                        Global Support Oversight
                    </h1>
                    <p className="text-muted-foreground mt-1">Platform-wide telemetry for boutique client inquiries.</p>
                </div>
            </header>

            <Card className="border-primary/50 overflow-hidden bg-slate-900/20 shadow-2xl">
                <CardHeader className="bg-muted/30 border-b border-primary/10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Communication Ledger</CardTitle>
                            <CardDescription>Consolidated stream of all customer inquiries across the platform.</CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Search Ref ID or Subject..." 
                                    className="pl-10 h-10 border-primary/20 bg-black/40"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select value={storeFilter} onValueChange={setStoreFilter}>
                                <SelectTrigger className="w-full md:w-[200px] h-10 border-primary/20 bg-black/40">
                                    <Filter className="h-3 w-3 mr-2 text-primary" />
                                    <SelectValue placeholder="All Boutiques" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-primary/20">
                                    <SelectItem value="all">All Boutiques</SelectItem>
                                    {stores?.map(s => (
                                        <SelectItem key={s.userId} value={s.userId}>{s.storeName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-black/40 border-primary/10">
                                <TableHead className="px-6">Boutique & Client</TableHead>
                                <TableHead>Strategic Inquiry</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-right">Transmission</TableHead>
                                <TableHead className="text-right px-6">Audit</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTickets.length > 0 ? filteredTickets.map((ticket) => (
                                <TableRow key={ticket.id} className="border-primary/5 hover:bg-primary/5 transition-colors group">
                                    <TableCell className="px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                                <Store className="h-5 w-5" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-bold text-slate-200 truncate max-w-[150px]">
                                                    {storesMap.get(ticket.storeId) || 'System Boutique'}
                                                </p>
                                                <code className="text-[10px] text-muted-foreground font-mono">UID: {ticket.storeId.slice(0, 8)}</code>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <p className="font-bold text-slate-300 text-sm group-hover:text-primary transition-colors">{ticket.subject}</p>
                                            <p className="text-[11px] text-slate-500 line-clamp-1 italic">"{ticket.message}"</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className={cn(
                                            "uppercase text-[9px] font-black",
                                            ticket.status === 'OPEN' ? "bg-green-500/10 text-green-500 border-green-500/30" : "text-slate-600 border-slate-800"
                                        )}>
                                            {ticket.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs font-mono font-bold text-slate-400">
                                                {ticket.createdAt ? format(ticket.createdAt.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt), 'MMM d') : '---'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right px-6">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10"
                                            asChild
                                        >
                                            <a href={`/store/${ticket.storeId}`} target="_blank">
                                                <ArrowUpRight className="h-3 w-3 mr-1" /> Inspect Store
                                            </a>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center text-muted-foreground italic">
                                        No support signals detected across the platform registry.
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
