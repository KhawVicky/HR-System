import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Bell, CheckCircle2, Mail } from "lucide-react";
import { PageLayout } from "./PageLayout";
import { Card, CardContent } from "./ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";
import { apiFetch, getStoredUser, NotificationItem, NotificationResponse } from "../lib/api";

const NOTIFICATIONS_PER_PAGE = 10;

function formatNotificationDate(value: string) {
  if (!value) return "-";
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-MY", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user?.id) return;

    const loadNotifications = async () => {
      setLoading(true);
      const data = await apiFetch<NotificationResponse>(
        `/notifications?userId=${user.id}`,
      );
      setItems(data.items);
      setPage(1);
      if (data.unreadCount > 0) {
        await apiFetch("/notifications/read", {
          method: "PATCH",
          body: JSON.stringify({ userId: user.id }),
        });
      }
      setLoading(false);
    };

    loadNotifications().catch(() => {
      setItems([]);
      setLoading(false);
    });
  }, [user?.id]);

  const pageCount = Math.max(
    1,
    Math.ceil(items.length / NOTIFICATIONS_PER_PAGE),
  );
  const visibleItems = items.slice(
    (page - 1) * NOTIFICATIONS_PER_PAGE,
    page * NOTIFICATIONS_PER_PAGE,
  );

  const openNotification = (notification: NotificationItem) => {
    if (notification.jobId) {
      navigate(`/jobs/${notification.jobId}/candidates`);
    }
  };

  return (
    <PageLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Notifications" },
      ]}
      title="Notifications"
      subtitle="Messages are kept for 90 days."
      useCard={false}
    >
      <div className="space-y-3">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-slate-500">
              Loading notifications...
            </CardContent>
          </Card>
        ) : items.length > 0 ? (
          <>
            {visibleItems.map((notification) => (
              <Card
                key={notification.id}
                className={
                  notification.isRead
                    ? "cursor-pointer border-slate-200"
                    : "cursor-pointer border-blue-200 bg-blue-50/40"
                }
                onClick={() => openNotification(notification)}
              >
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-[#003B7A] text-white">
                    {notification.notificationType === "email_sent" ? (
                      <Mail className="h-5 w-5" />
                    ) : (
                      <Bell className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-semibold text-slate-900">
                            {notification.title}
                          </h2>
                          {!notification.isRead && (
                            <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                              New
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-slate-700">
                          {notification.message}
                        </p>
                      </div>
                      <div className="shrink-0 text-right text-sm text-slate-500">
                        {formatNotificationDate(notification.createdAt)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {pageCount > 1 && (
              <Pagination className="pt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        setPage((current) => Math.max(1, current - 1));
                      }}
                    />
                  </PaginationItem>
                  {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                    (pageNumber) => (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          href="#"
                          isActive={pageNumber === page}
                          onClick={(event) => {
                            event.preventDefault();
                            setPage(pageNumber);
                          }}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        setPage((current) =>
                          Math.min(pageCount, current + 1),
                        );
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
              <div className="font-semibold text-slate-900">
                No notifications
              </div>
              <div className="text-sm text-slate-500">
                New candidate applications will appear here.
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
