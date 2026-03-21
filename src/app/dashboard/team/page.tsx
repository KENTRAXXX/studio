'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserProfile } from '@/firebase/user-profile-provider';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { UserPlus, Shield, Mail, Trash2, CheckCircle2, Clock, ShieldCheck, Briefcase, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getTier } from '@/lib/tiers';
import { BackButton } from '@/components/ui/back-button';

export default function TeamManagementPage() {
    const { userProfile } = useUserProfile();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [members, setMembers] = useState<any[]>([]);
    const [invitations, setInvitations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviting, setInviting] = useState(false);
    
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'OPERATIONS' | 'ANALYST' | 'FINANCE' | 'MARKETING'>('OPERATIONS');

    const tier = getTier(userProfile?.planTier);
    const maxSeats = tier.teamSeats.business;

    useEffect(() => {
        if (!userProfile?.id || !firestore) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch members (users with this account as parent)
                const membersQuery = query(
                    collection(firestore, 'users'),
                    where('parentId', '==', userProfile.id)
                );
                const membersSnap = await getDocs(membersQuery);
                const membersList = membersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                // Add the owner to the list
                setMembers([{ ...userProfile, isOwner: true }, ...membersList]);

                // Fetch pending invitations
                const invitesQuery = query(
                    collection(firestore, 'invitations'),
                    where('parentId', '==', userProfile.id),
                    where('status', '==', 'pending')
                );
                const invitesSnap = await getDocs(invitesQuery);
                setInvitations(invitesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error('Error fetching team data:', error);
                toast({
                    title: "Fetch failed",
                    description: "Failed to load team data",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userProfile?.id, firestore]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !userProfile?.id) return;
        
        if (members.length + invitations.length >= maxSeats) {
            toast({
                title: "Team limit reached",
                description: `Your ${tier.label} plan allows a maximum of ${maxSeats} seats.`,
                variant: "destructive"
            });
            return;
        }

        setInviting(true);
        try {
            await addDoc(collection(firestore, 'invitations'), {
                email,
                role,
                parentId: userProfile.id,
                planTier: userProfile.planTier,
                status: 'pending',
                invitedAt: new Date().toISOString(),
                invitationLink: `${window.location.origin}/signup?ref=team&parentId=${userProfile.id}&role=${role}&tier=${userProfile.planTier}`
            });
            
            toast({
                title: "Invitation sent",
                description: `Access link generated for ${email}`,
            });
            setEmail('');
            // Refresh invites
            const invitesQuery = query(
                collection(firestore, 'invitations'),
                where('parentId', '==', userProfile.id),
                where('status', '==', 'pending')
            );
            const invitesSnap = await getDocs(invitesQuery);
            setInvitations(invitesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error('Error sending invitation:', error);
            toast({
                title: "Invite failed",
                description: "Failed to send invitation",
                variant: "destructive"
            });
        } finally {
            setInviting(false);
        }
    };

    const removeMember = async (memberId: string) => {
        if (!firestore) return;
        if (!confirm('Are you sure you want to remove this member? They will lose all access to the business hub.')) return;

        try {
            const userRef = doc(firestore, 'users', memberId);
            await updateDoc(userRef, {
                parentId: null,
                hasAccess: false,
                businessRole: null
            });
            setMembers(members.filter(m => m.id !== memberId));
            toast({
                title: "Member removed",
                description: "The strategic seat has been revoked.",
                variant: "destructive"
            });
        } catch (error) {
            console.error('Error removing member:', error);
            toast({
                title: "Removal failed",
                description: "Failed to remove member",
                variant: "destructive"
            });
        }
    };

    const cancelInvitation = async (inviteId: string) => {
        if (!firestore) return;
        try {
            await deleteDoc(doc(firestore, 'invitations', inviteId));
            setInvitations(invitations.filter(i => i.id !== inviteId));
            toast({
                title: "Invitation cancelled",
                description: "The outbound transmission was terminated.",
            });
        } catch (error) {
            console.error('Error cancelling invitation:', error);
            toast({
                title: "Cancellation failed",
                description: "Failed to cancel invitation",
                variant: "destructive"
            });
        }
    };

    if (userProfile?.businessRole !== 'OWNER' && userProfile?.entityType === 'BUSINESS') {
        return <div className="p-8 text-center">Access Denied: Team management is reserved for the Account Owner.</div>;
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto relative">
            <div className="absolute -top-4 -left-4">
                <BackButton label="Dashboard" href="/dashboard" />
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline text-primary uppercase tracking-tight">Team Hub</h1>
                    <p className="text-muted-foreground text-sm">Manage the active seats for your {tier.label} Strategic Hub.</p>
                </div>
                <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-lg flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-[10px] uppercase font-black tracking-widest text-primary/60 leading-none">Capacity</p>
                        <p className="text-xl font-headline font-bold text-white">{members.length + invitations.length} / {maxSeats} <span className="text-xs text-muted-foreground uppercase">Seats</span></p>
                    </div>
                    <div className="h-8 w-px bg-primary/20" />
                    <UserPlus className="h-5 w-5 text-primary opacity-50" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Invitation Form */}
                <Card className="lg:col-span-1 border-primary/30 bg-card/50 backdrop-blur-md h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg font-headline flex items-center gap-2">
                            <Mail className="h-5 w-5 text-primary" /> Recruit Member
                        </CardTitle>
                        <CardDescription>Grant a new strategic seat in your ecosystem.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[10px] uppercase font-black tracking-widest text-primary/60">Email Address</Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    placeholder="strategist@company.com" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-background/50 border-primary/20 focus:border-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role" className="text-[10px] uppercase font-black tracking-widest text-primary/60">Strategic Role</Label>
                                <Select value={role} onValueChange={(v: any) => setRole(v)}>
                                    <SelectTrigger className="bg-background/50 border-primary/20">
                                        <SelectValue placeholder="Select Role" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-primary/30">
                                        <SelectItem value="OPERATIONS">Operations Manager</SelectItem>
                                        <SelectItem value="ANALYST">Strategic Analyst</SelectItem>
                                        <SelectItem value="FINANCE">Financial Officer</SelectItem>
                                        <SelectItem value="MARKETING">Marketing Lead</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button 
                                type="submit" 
                                className="w-full btn-gold-glow bg-primary text-primary-foreground font-bold uppercase tracking-tighter"
                                disabled={inviting || members.length + invitations.length >= maxSeats}
                            >
                                {inviting ? 'Recruiting...' : 'Send Access Link'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Team List */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-primary/30 bg-card/50 backdrop-blur-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-headline flex items-center gap-2 uppercase">
                                <Briefcase className="h-5 w-5 text-primary" /> Active Deployments
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {loading ? (
                                    <div className="py-8 text-center text-muted-foreground animate-pulse">Loading core team...</div>
                                ) : members.length === 0 ? (
                                    <div className="py-8 text-center text-muted-foreground italic">No members deployed.</div>
                                ) : (
                                    members.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/10 group transition-all hover:bg-primary/10">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                                                    <User className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white text-sm">{member.displayName || member.fullName || member.email}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <Badge variant="outline" className="text-[8px] h-4 bg-primary/10 border-primary/20 uppercase font-black tracking-widest">
                                                            {member.businessRole}
                                                        </Badge>
                                                        {member.status === 'approved' ? (
                                                            <div className="flex items-center gap-1 text-[8px] text-green-500 font-bold uppercase">
                                                                <CheckCircle2 className="h-2.5 w-2.5" /> Identity Verified
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1 text-[8px] text-amber-500 font-bold uppercase">
                                                                <Clock className="h-2.5 w-2.5" /> Pending KYC
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {!member.isOwner && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-opacity"
                                                    onClick={() => removeMember(member.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {member.isOwner && (
                                                <ShieldCheck className="h-5 w-5 text-primary opacity-30" />
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {invitations.length > 0 && (
                        <Card className="border-amber-500/30 bg-amber-500/5 backdrop-blur-md">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-md font-headline flex items-center gap-2 uppercase text-amber-500">
                                    <Clock className="h-4 w-4" /> Outbound Transmissions
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {invitations.map((invite) => (
                                        <div key={invite.id} className="flex items-center justify-between p-3 rounded-md border border-amber-500/20 bg-amber-500/10">
                                            <div className="flex items-center gap-3">
                                                <Mail className="h-4 w-4 text-amber-500" />
                                                <div>
                                                    <p className="text-xs font-bold text-white leading-none">{invite.email}</p>
                                                    <p className="text-[10px] text-amber-500/70 font-black uppercase mt-1 tracking-tighter">Role: {invite.role}</p>
                                                </div>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-[10px] text-muted-foreground hover:text-amber-500 font-black uppercase"
                                                onClick={() => cancelInvitation(invite.id)}
                                            >
                                                REVOKE
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

