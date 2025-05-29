import React, { useState, ReactNode, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { NavIcons } from "./SubjectIcons";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import AdminLogin from "./AdminLogin";
import Footer from "./Footer";
import FriendsModal from "./FriendsModal";
import FriendScheduleModal from "./FriendScheduleModal";
import { Button } from "@/components/ui/button";
import { Sun, Moon, LogOut, UserCheck, MessageCircle, Phone, Mail, Users, Copy, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { isAdmin, logout } = useAuth();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showContactPopup, setShowContactPopup] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<{id: string, name: string} | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Generate a persistent user ID with option for custom ID
  const currentUserId = useMemo(() => {
    let userId = localStorage.getItem('currentUserId');
    if (!userId) {
      // Prompt user to create custom ID
      const customId = prompt('أدخل معرفك الفريد الخاص بك (يجب أن يكون فريداً):');
      if (customId && customId.trim()) {
        userId = customId.trim();
      } else {
        // Generate automatic ID if user cancels or enters nothing
        userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      localStorage.setItem('currentUserId', userId);
    }
    return userId;
  }, []);

  const [currentUserName] = useState(() => {
    const stored = localStorage.getItem('currentUserName');
    if (stored) return stored;
    const newName = `المستخدم_${Math.random().toString(36).substr(2, 6)}`;
    localStorage.setItem('currentUserName', newName);
    return newName;
  });

  const getCurrentSection = (): string => {
    if (location.startsWith("/analytics")) return "analytics";
    if (location === "/" || location.startsWith("/files")) return "files";
    if (location.startsWith("/study-schedule")) return "study-schedule";
    if (location.startsWith("/exams")) return "exams";
    if (location.startsWith("/quizzes") || location.startsWith("/quiz")) return "quizzes";
    return "files";
  };

  const currentSection = getCurrentSection();

  const copyUserId = async () => {
    try {
      await navigator.clipboard.writeText(currentUserId);
      setCopied(true);
      toast({
        title: "تم النسخ!",
        description: "تم نسخ المعرف الفريد بنجاح",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "خطأ في النسخ",
        description: "حدث خطأ أثناء نسخ المعرف",
        variant: "destructive",
      });
    }
  };

  const handleViewFriendSchedule = (friendId: string, friendName: string) => {
    setSelectedFriend({ id: friendId, name: friendName });
    setShowFriendsModal(false);
  };



  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl sm:text-2xl font-bold text-primary dark:text-primary-foreground">دفعة 2026</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Friends Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFriendsModal(true)}
              className="rounded-full"
            >
              <Users className="h-4 w-4" />
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="تبديل الوضع الليلي"
              className="rounded-full"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {isAdmin && (
              <Link href="/analytics">
                <Button
                  variant={getCurrentSection() === "analytics" ? "default" : "outline"}
                  className="flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                  <span className="hidden sm:inline">التحليلات</span>
                </Button>
              </Link>
            )}

            {!isAdmin ? (
              <Button onClick={() => setShowAdminLogin(true)} className="flex items-center space-x-1 space-x-reverse">
                <UserCheck className="h-4 w-4 ml-2" />
                <span className="hidden sm:inline">تسجيل دخول المشرف</span>
              </Button>
            ) : (
              <Button 
                variant="destructive" 
                onClick={logout} 
                className="flex items-center space-x-1 space-x-reverse"
              >
                <LogOut className="h-4 w-4 ml-2" />
                <span className="hidden sm:inline">تسجيل خروج</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        {/* Main Content */}
        <main className="flex-1">
          <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 mb-16">
            {children}
          </div>
        </main>

        {/* Contact Button - Fixed above bottom navigation */}
        <div className="fixed bottom-20 right-4 z-50">
          <div className="relative">
            {showContactPopup && (
              <div className="absolute bottom-16 right-0 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-xl p-3 w-56 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
                <div className="flex flex-col gap-2">
                  <h3 className="font-semibold text-center mb-2 text-gray-800 dark:text-gray-200">للتواصل</h3>

                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-10 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-all duration-200 hover:scale-[1.02]"
                    onClick={() => {
                      window.open('https://wa.me/96566162173', '_blank');
                      setShowContactPopup(false);
                    }}
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">واتساب</span>
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-10 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200 hover:scale-[1.02]"
                    onClick={() => {
                      window.open('mailto:moahemd66162173@gmail.com', '_blank');
                      setShowContactPopup(false);
                    }}
                  >
                    <Mail className="h-4 w-4" />
                    <span className="text-sm font-medium">بريد إلكتروني</span>
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-10 text-pink-600 hover:text-pink-700 hover:bg-pink-50 dark:hover:bg-pink-900/30 rounded-lg transition-all duration-200 hover:scale-[1.02]"
                    onClick={() => {
                      window.open('https://www.tiktok.com/@mo2025_editor', '_blank');
                      setShowContactPopup(false);
                    }}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-.88-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                    </svg>
                    <span className="text-sm font-medium">تيكتوك</span>
                  </Button>
                </div>
              </div>
            )}

            <Button
              size="icon"
              className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-white/20"
              onClick={() => setShowContactPopup(!showContactPopup)}
            >
              <MessageCircle className="h-6 w-6 text-white" />
            </Button>
          </div>
        </div>

        {/* Overlay to close popup when clicking outside */}
        {showContactPopup && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowContactPopup(false)}
          />
        )}

        {/* Bottom Navigation (visible on all screen sizes) */}
        <nav className="fixed bottom-0 right-0 left-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-2 py-2">
          <div className="flex justify-around items-center">
            <Link href="/files" className={`flex flex-col items-center p-2 ${
              currentSection === "files" ? "text-primary" : "text-gray-500 dark:text-gray-400"
            }`}>
              <NavIcons.files className="text-lg" />
              <span className="text-xs mt-1">الملفات</span>
            </Link>
            <Link href="/study-schedule" className={`flex flex-col items-center p-2 ${
              currentSection === "study-schedule" ? "text-primary" : "text-gray-500 dark:text-gray-400"
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><rect width="6" height="6" x="9" y="12" rx="1"/></svg>
              <span className="text-xs mt-1">جدول المذاكرة</span>
            </Link>
            <Link href="/exams" className={`flex flex-col items-center p-2 ${
              currentSection === "exams" ? "text-primary" : "text-gray-500 dark:text-gray-400"
            }`}>
              <NavIcons.exams className="text-lg" />
              <span className="text-xs mt-1">جدول الاختبارات</span>
            </Link>
            <Link href="/quizzes" className={`flex flex-col items-center p-2 ${
              currentSection === "quizzes" ? "text-primary" : "text-gray-500 dark:text-gray-400"
            }`}>
              <NavIcons.quizzes className="text-lg" />
              <span className="text-xs mt-1">الاختبارات الاكترونية</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* Footer - Hide on mobile */}
      <div className="hidden lg:block">
        <Footer />
      </div>

      {/* Admin Login Modal */}
      <AdminLogin 
        isOpen={showAdminLogin} 
        onClose={() => setShowAdminLogin(false)} 
      />

      {/* Friends Modal */}
      <FriendsModal
        open={showFriendsModal}
        onClose={() => setShowFriendsModal(false)}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        onViewFriendSchedule={handleViewFriendSchedule}
      />

      {/* Friend Schedule Modal */}
      {selectedFriend && (
        <FriendScheduleModal
          open={!!selectedFriend}
          onClose={() => setSelectedFriend(null)}
          friendId={selectedFriend.id}
          friendName={selectedFriend.name}
        />
      )}
    </div>
  );
};

export default Layout;