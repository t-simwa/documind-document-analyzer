import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  MessageCircleMore,
  SendHorizonal,
  Trash2,
  CheckCircle2,
  Circle,
  Reply,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { commentsApi } from "@/services/api";
import { saveDocumentComments, loadDocumentComments } from "@/utils/documentDataStorage";
import type { Comment } from "@/types/api";

interface CommentsPanelProps {
  documentId: string;
  page?: number;
  onCommentClick?: (comment: Comment) => void;
  className?: string;
}

export const CommentsPanel = ({
  documentId,
  page,
  onCommentClick,
  className,
}: CommentsPanelProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load cached comments first
    const cachedComments = loadDocumentComments(documentId, page);
    if (cachedComments.length > 0) {
      setComments(cachedComments);
    }
    
    // Then fetch fresh comments
    loadComments();
  }, [documentId, page]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const loadedComments = await commentsApi.getComments(documentId, page);
      setComments(loadedComments);
      
      // Save to localStorage
      saveDocumentComments(documentId, loadedComments, page);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load comments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const comment = await commentsApi.createComment({
        documentId,
        content: newComment.trim(),
        page,
      });
      const updatedComments = [...comments, comment];
      setComments(updatedComments);
      setNewComment("");
      
      // Save to localStorage
      saveDocumentComments(documentId, updatedComments, page);
      
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      const reply = await commentsApi.createComment({
        documentId,
        content: replyContent.trim(),
        page,
        parentId,
      });
      
      const updatedComments = comments.map((comment) =>
        comment.id === parentId
          ? {
              ...comment,
              replies: [...(comment.replies || []), reply],
            }
          : comment
      );
      setComments(updatedComments);
      
      // Save to localStorage
      saveDocumentComments(documentId, updatedComments, page);
      
      setReplyContent("");
      setReplyingTo(null);
      toast({
        title: "Reply added",
        description: "Your reply has been added successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentsApi.deleteComment(commentId);
      const updatedComments = comments.filter((c) => c.id !== commentId);
      setComments(updatedComments);
      
      // Save to localStorage
      saveDocumentComments(documentId, updatedComments, page);
      
      toast({
        title: "Comment deleted",
        description: "The comment has been deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleResolveComment = async (commentId: string) => {
    try {
      const comment = comments.find((c) => c.id === commentId);
      if (!comment) return;

      await commentsApi.updateComment(commentId, {
        resolved: !comment.resolved,
      });

      const updatedComments = comments.map((c) =>
        c.id === commentId ? { ...c, resolved: !c.resolved } : c
      );
      setComments(updatedComments);
      
      // Save to localStorage
      saveDocumentComments(documentId, updatedComments, page);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn("flex flex-col h-full border-l border-border/50 bg-background", className)}>
      {/* Comments List */}
      <ScrollArea className="flex-1">
        <div className="px-5 py-4 space-y-3">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-muted/40 mb-3">
                <MessageCircleMore className="h-5 w-5 text-muted-foreground animate-pulse" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-muted/40 mb-3">
                <MessageCircleMore className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-xs text-muted-foreground font-medium mb-1">No comments yet</p>
              <p className="text-xs text-muted-foreground/70">Start the conversation below</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={cn(
                  "group space-y-2.5 p-3.5 rounded-lg border transition-all duration-200",
                  comment.resolved 
                    ? "bg-muted/20 border-border/30" 
                    : "bg-card/50 border-border/50 hover:bg-card hover:border-border"
                )}
              >
                {/* Comment Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <Avatar className="h-7 w-7 border border-border/50">
                      <AvatarFallback className="text-xs font-medium bg-muted/50">
                        {comment.createdByUser
                          ? getInitials(comment.createdByUser.name)
                          : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {comment.createdByUser?.name || "Unknown User"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {format(comment.createdAt, "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleResolveComment(comment.id)}
                      title={comment.resolved ? "Unresolve" : "Resolve"}
                    >
                      {comment.resolved ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Comment Content */}
                <p className="text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap pl-9.5">
                  {comment.content}
                </p>

                {/* Page Reference */}
                {comment.page !== undefined && (
                  <div className="pl-9.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px] text-muted-foreground hover:text-foreground px-2"
                      onClick={() => onCommentClick?.(comment)}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Go to page {comment.page + 1}
                    </Button>
                  </div>
                )}

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-9.5 mt-2.5 space-y-2.5 border-l-2 border-border/30 pl-3">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5 border border-border/50">
                            <AvatarFallback className="text-[10px] font-medium bg-muted/50">
                              {reply.createdByUser
                                ? getInitials(reply.createdByUser.name)
                                : "U"}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-[11px] font-semibold text-foreground">
                            {reply.createdByUser?.name || "Unknown User"}
                          </p>
                          <span className="text-[11px] text-muted-foreground">
                            {format(reply.createdAt, "MMM d, h:mm a")}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap ml-7">
                          {reply.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Input */}
                {replyingTo === comment.id ? (
                  <div className="ml-9.5 mt-2 space-y-2">
                    <Textarea
                      placeholder="Write a reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="min-h-[60px] text-xs resize-none border-border/50 focus-visible:ring-1"
                      ref={textareaRef}
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSubmitReply(comment.id)}
                        disabled={isSubmitting || !replyContent.trim()}
                        className="h-7 text-xs"
                      >
                        <SendHorizonal className="h-3 w-3 mr-1" />
                        Reply
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="pl-9.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px] text-muted-foreground hover:text-foreground px-2"
                      onClick={() => {
                        setReplyingTo(comment.id);
                        setTimeout(() => textareaRef.current?.focus(), 0);
                      }}
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <Separator />

      {/* New Comment Input */}
      <div className="p-4 border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[80px] mb-2.5 text-xs resize-none border-border/50 focus-visible:ring-1"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSubmitComment();
            }
          }}
        />
        <Button
          onClick={handleSubmitComment}
          disabled={isSubmitting || !newComment.trim()}
          className="w-full h-8 text-xs"
        >
          <SendHorizonal className="h-3.5 w-3.5 mr-1.5" />
          {isSubmitting ? "Posting..." : "Post comment"}
        </Button>
      </div>
    </div>
  );
};
