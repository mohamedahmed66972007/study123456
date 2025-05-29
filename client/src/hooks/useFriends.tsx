import { useState, useEffect } from "react";
import { useToast } from "./use-toast";

export interface User {
  id: number;
  userId: string;
  name: string;
  createdAt: string;
}

export interface FriendRequest {
  id: number;
  senderId: string;
  receiverId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  senderName?: string;
}

export interface Friend {
  id: number;
  userId: string;
  friendId: string;
  friendName?: string;
  createdAt: string;
}

export function useFriends(currentUserId: string) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchFriends = async () => {
    try {
      const response = await fetch(`/api/friends/${currentUserId}`);
      if (response.ok) {
        const data = await response.json();
        setFriends(data);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const response = await fetch(`/api/friend-requests/${currentUserId}`);
      if (response.ok) {
        const data = await response.json();
        setFriendRequests(data);
      }
    } catch (error) {
      console.error("Error fetching friend requests:", error);
    }
  };

  const createUser = async (userData: { userId: string; name: string }) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        if (response.status === 409) {
          toast({
            title: "معرف مكرر",
            description: error.message,
            variant: "destructive",
          });
          // Clear localStorage and reload to get new ID
          localStorage.removeItem('currentUserId');
          window.location.reload();
          return false;
        }
        throw new Error(error.message);
      }
      
      // Refresh data after creating/updating user
      fetchFriends();
      fetchFriendRequests();
      return true;
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "خطأ في إنشاء المستخدم",
        description: "حدث خطأ أثناء إنشاء المستخدم",
        variant: "destructive",
      });
      return false;
    }
  };

  const searchUsers = async (query: string): Promise<User[]> => {
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error("Error searching users:", error);
      return [];
    }
  };

  const sendFriendRequest = async (receiverId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/friend-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUserId,
          receiverId: receiverId,
        }),
      });

      if (response.ok) {
        toast({
          title: "تم إرسال الطلب",
          description: "تم إرسال طلب الصداقة بنجاح",
          duration: 3000,
        });
        return true;
      } else {
        const error = await response.json();
        toast({
          title: "خطأ",
          description: error.message || "فشل في إرسال طلب الصداقة",
          variant: "destructive",
          duration: 3000,
        });
        return false;
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إرسال طلب الصداقة",
        variant: "destructive",
        duration: 3000,
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const respondToFriendRequest = async (requestId: number, status: "accepted" | "rejected") => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/friend-requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast({
          title: status === "accepted" ? "تم قبول الطلب" : "تم رفض الطلب",
          description: status === "accepted" ? "تم إضافة صديق جديد" : "تم رفض طلب الصداقة",
          duration: 3000,
        });

        // Refresh data
        await fetchFriendRequests();
        if (status === "accepted") {
          await fetchFriends();
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error responding to friend request:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFriend = async (friendId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/friends/${currentUserId}/${friendId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "تم حذف الصديق",
          description: "تم حذف الصديق من قائمتك",
          duration: 3000,
        });
        await fetchFriends();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error removing friend:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loadFriends = async () => {
    await fetchFriends();
  };

  const loadFriendRequests = async () => {
    await fetchFriendRequests();
  };

  useEffect(() => {
    if (!currentUserId) return;

    loadFriends();
    loadFriendRequests();

    // Poll for updates every 3 seconds to ensure real-time updates
    const interval = setInterval(() => {
      loadFriends();
      loadFriendRequests();
    }, 3000);

    return () => clearInterval(interval);
  }, [currentUserId]);

  return {
    friends,
    friendRequests,
    isLoading,
    createUser,
    searchUsers,
    sendFriendRequest,
    respondToFriendRequest,
    removeFriend,
    refreshData: () => {
      fetchFriends();
      fetchFriendRequests();
    }
  };
}