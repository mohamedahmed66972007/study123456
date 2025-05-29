import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  RefreshCw, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Copy,
  Download,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubjectIcon, getSubjectColor } from "./SubjectIcons";
import { StudySession } from "@/pages/StudySchedule";
import dayjs from "dayjs";

interface FriendScheduleModalProps {
  open: boolean;
  onClose: () => void;
  friendId: string;
  friendName: string;
}

export default function FriendScheduleModal({ 
  open, 
  onClose, 
  friendId, 
  friendName 
}: FriendScheduleModalProps) {
  const [friendSessions, setFriendSessions] = useState<StudySession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { toast } = useToast();

  // Simulate real-time updates by polling localStorage changes
  // In a real implementation, this would use WebSocket or Server-Sent Events
  useEffect(() => {
    const loadFriendSchedule = () => {
      setIsLoading(true);
      try {
        // In a real implementation, this would fetch from the server
        // For now, we'll simulate with localStorage data with a prefix
        const friendScheduleKey = `studySessions_${friendId}`;
        const savedSessions = localStorage.getItem(friendScheduleKey);

        if (savedSessions) {
          setFriendSessions(JSON.parse(savedSessions));
        } else {
          // If no specific friend data, show demo data
          setFriendSessions([]);
        }
        setLastUpdate(new Date());
      } catch (error) {
        console.error("Error loading friend schedule:", error);
        setFriendSessions([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (open && friendId) {
      loadFriendSchedule();

      // Poll for updates every 5 seconds
      const interval = setInterval(loadFriendSchedule, 5000);

      return () => clearInterval(interval);
    }
  }, [open, friendId]);

  const getSubjectName = (subject: string) => {
    const subjects: Record<string, string> = {
      arabic: "اللغة العربية",
      english: "اللغة الإنجليزية", 
      math: "الرياضيات",
      chemistry: "الكيمياء",
      physics: "الفيزياء",
      biology: "الأحياء",
      geology: "الجيولوجيا",
      constitution: "الدستور",
      islamic: "التربية الإسلامية"
    };
    return subjects[subject] || subject;
  };

  const activeSessions = friendSessions.filter(s => s.status === 'active')
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const completedSessions = friendSessions.filter(s => s.status === 'completed');
  const postponedSessions = friendSessions.filter(s => s.status === 'postponed');

  const renderSession = (session: StudySession) => {
    const completedLessons = session.lessons.filter(l => l.completed).length;

    return (
      <Card key={session.id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SubjectIcon 
                subject={session.subject} 
                className="h-6 w-6 text-current" 
              />
              <h3 className="text-lg font-medium">{getSubjectName(session.subject)}</h3>
            </div>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>التاريخ: {dayjs(session.startDate).format("DD/MM/YYYY")}</div>
              <div>اليوم: {dayjs(session.startDate).format("dddd")}</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>البداية: {dayjs(session.startDate).format("h:mm A")}</div>
              <div>النهاية: {dayjs(session.endDate).format("h:mm A")}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">الدروس ({completedLessons}/{session.lessons.length})</span>
              <div className="text-sm text-muted-foreground">
                {Math.round((completedLessons / session.lessons.length) * 100)}%
              </div>
            </div>

            {session.lessons.map((lesson, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded gap-2">
                <span className={`${lesson.completed ? 'line-through text-muted-foreground' : ''} flex-1`}>
                  {lesson.name}
                </span>
                {lesson.completed ? (
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const handleCopySchedule = () => {
    const scheduleString = JSON.stringify(friendSessions);
    navigator.clipboard.writeText(scheduleString)
      .then(() => {
        toast({
          title: "تم نسخ الجدول!",
          description: "يمكنك الآن لصق الجدول في مكان آخر.",
        });
      })
      .catch((err) => {
        toast({
          variant: "destructive",
          title: "حدث خطأ أثناء النسخ!",
          description: "يرجى المحاولة مرة أخرى.",
        });
        console.error("Could not copy text: ", err);
      });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Users className="h-5 w-5" />
            جدول {friendName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadFriendSchedule}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
              <div className="text-sm text-muted-foreground">
                آخر تحديث: {lastUpdate.toLocaleTimeString('ar-EG')}
              </div>
            </div>

            {activeSessions.length > 0 && (
              <Button
                onClick={copyFriendSchedule}
                variant="default"
                size="sm"
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                نسخ الجدول
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span>جاري التحديث...</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden">
              <Tabs defaultValue="current" className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
                  <TabsTrigger value="current">
                    الجدول الحالي ({activeSessions.length})
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    الإنجازات ({completedSessions.length})
                  </TabsTrigger>
                  <TabsTrigger value="postponed">
                    المؤجلات ({postponedSessions.length})
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-hidden mt-4">
                  <TabsContent value="current" className="h-full">
                    <div className="h-full overflow-y-auto pr-2">
                      {activeSessions.length === 0 ? (
                        <Card>
                          <CardContent className="p-6 text-center text-muted-foreground">
                            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                            <p>لا توجد مواد مجدولة حالياً</p>
                          </CardContent>
                        </Card>
                      ) : (
                        activeSessions.map(renderSession)
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="completed" className="h-full">
                    <div className="h-full overflow-y-auto pr-2">
                      {completedSessions.length === 0 ? (
                        <Card>
                          <CardContent className="p-6 text-center text-muted-foreground">
                            <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                            <p>لا توجد إنجازات بعد</p>
                          </CardContent>
                        </Card>
                      ) : (
                        completedSessions.map(renderSession)
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="postponed" className="h-full">
                    <div className="h-full overflow-y-auto pr-2">
                      {postponedSessions.length === 0 ? (
                        <Card>
                          <CardContent className="p-6 text-center text-muted-foreground">
                            <Clock className="h-12 w-12 mx-auto mb-4" />
                            <p>لا توجد مواد مؤجلة</p>
                          </CardContent>
                        </Card>
                      ) : (
                        postponedSessions.map(renderSession)
                      )}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}