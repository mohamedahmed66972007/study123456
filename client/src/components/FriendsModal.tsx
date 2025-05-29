
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, 
  UserPlus, 
  Users, 
  Clock, 
  Check, 
  X, 
  Trash2,
  Eye,
  Copy
} from "lucide-react";
import { useFriends, type User } from "@/hooks/useFriends";
import { useToast } from "@/hooks/use-toast";

interface FriendsModalProps {
  open: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserName: string;
  onViewFriendSchedule: (friendId: string, friendName: string) => void;
}

export default function FriendsModal({ 
  open, 
  onClose, 
  currentUserId, 
  currentUserName,
  onViewFriendSchedule 
}: FriendsModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  
  const {
    friends,
    friendRequests,
    isLoading,
    createUser,
    searchUsers,
    sendFriendRequest,
    respondToFriendRequest,
    removeFriend,
    refreshData
  } = useFriends(currentUserId);

  // Create user when modal opens
  useEffect(() => {
    if (open && currentUserId && currentUserName) {
      createUser({ userId: currentUserId, name: currentUserName });
    }
  }, [open, currentUserId, currentUserName]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchUsers(searchQuery.trim());
      setSearchResults(results.filter(user => user.userId !== currentUserId));
    } catch (error) {
      toast({
        title: "خطأ في البحث",
        description: "حدث خطأ أثناء البحث عن المستخدمين",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (receiverId: string) => {
    const success = await sendFriendRequest(receiverId);
    if (success) {
      setSearchResults([]);
      setSearchQuery("");
    }
  };

  const pendingRequests = friendRequests.filter(req => req.status === "pending");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Users className="h-5 w-5" />
            إدارة الأصدقاء
          </DialogTitle>
          
          {/* Copy ID Section */}
          <div className="bg-muted rounded-lg p-3 mt-4">
            <div className="text-sm text-center mb-2">معرفك الفريد:</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 text-xs font-mono bg-background border rounded px-2 py-1 text-center">
                {currentUserId}
              </div>
              <Button
                size="sm"
                onClick={() => {
                  if (!localStorage.getItem('currentUserName')) {
                    const name = prompt('ادخل اسمك:');
                    if (name) {
                      localStorage.setItem('currentUserName', name);
                    } else {
                      return;
                    }
                  }
                  navigator.clipboard.writeText(currentUserId);
                  toast({
                    title: "تم النسخ!",
                    description: "تم نسخ المعرف الفريد بنجاح",
                  });
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              البحث
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              الطلبات ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              الأصدقاء ({friends.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="ابحث بالمعرف الفريد للمستخدم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || !searchQuery.trim()}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">نتائج البحث:</h3>
                {searchResults.map((user) => (
                  <Card key={user.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">@{user.userId}</div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSendRequest(user.userId)}
                        disabled={isLoading}
                      >
                        <UserPlus className="h-4 w-4 ml-1" />
                        إرسال طلب
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {searchQuery && searchResults.length === 0 && !isSearching && (
              <div className="text-center text-muted-foreground py-8">
                لا توجد نتائج للبحث
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            {pendingRequests.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                لا توجد طلبات صداقة معلقة
              </div>
            ) : (
              <div className="space-y-2">
                {pendingRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{request.senderName}</div>
                        <div className="text-sm text-muted-foreground">@{request.senderId}</div>
                        <Badge variant="secondary" className="mt-1">
                          <Clock className="h-3 w-3 ml-1" />
                          معلق
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => respondToFriendRequest(request.id, "accepted")}
                          disabled={isLoading}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => respondToFriendRequest(request.id, "rejected")}
                          disabled={isLoading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="friends" className="space-y-4">
            {friends.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                لا توجد أصدقاء بعد
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <Card key={friend.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{friend.friendName}</div>
                        <div className="text-sm text-muted-foreground">@{friend.friendId}</div>
                        <Badge variant="default" className="mt-1">
                          صديق
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewFriendSchedule(friend.friendId, friend.friendName || friend.friendId)}
                        >
                          <Eye className="h-4 w-4 ml-1" />
                          عرض الجدول
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeFriend(friend.friendId)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
