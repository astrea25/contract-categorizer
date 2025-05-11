import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Reply, Trash2 } from "lucide-react";
import { Comment, addComment, addReply, deleteComment } from "@/lib/data";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface CommentSectionProps {
    contractId: string;
    comments: Comment[];
    userEmail: string;
    onCommentsChange: () => void;
}

const CommentSection = (
    {
        contractId,
        comments,
        userEmail,
        onCommentsChange
    }: CommentSectionProps
) => {
    const {
        currentUser
    } = useAuth();

    const [newComment, setNewComment] = useState("");
    const [replyText, setReplyText] = useState<Record<string, string>>({});
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [commentToDelete, setCommentToDelete] = useState<{
        id: string;
        parentId?: string;
    } | null>(null);

    const handleSubmitComment = async () => {
        if (!newComment.trim())
            return;

        try {
            setIsSubmitting(true);
            await addComment(contractId, newComment.trim(), userEmail, currentUser?.displayName || "");
            setNewComment("");
            onCommentsChange();
            toast.success("Comment added successfully");
        } catch (error) {
            toast.error("Failed to add comment");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitReply = async (parentId: string) => {
        const reply = replyText[parentId];

        if (!reply?.trim())
            return;

        try {
            setIsSubmitting(true);

            await addReply(
                contractId,
                parentId,
                reply.trim(),
                userEmail,
                currentUser?.displayName || ""
            );

            setReplyText(prev => ({
                ...prev,
                [parentId]: ""
            }));

            setReplyingTo(null);
            onCommentsChange();
            toast.success("Reply added successfully");
        } catch (error) {
            toast.error("Failed to add reply");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteComment = async () => {
        if (!commentToDelete)
            return;

        try {
            await deleteComment(contractId, commentToDelete.id, commentToDelete.parentId);
            setCommentToDelete(null);
            onCommentsChange();
            toast.success("Comment deleted successfully");
        } catch (error) {
            toast.error("Failed to delete comment");
        }
    };

    const getInitials = (comment: Comment) => {
        if (comment.userName) {
            const nameParts = comment.userName.split(" ");

            if (nameParts.length > 1) {
                return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
            }

            return comment.userName.substring(0, 2).toUpperCase();
        }

        return comment.userEmail.substring(0, 2).toUpperCase();
    };

    const getDisplayName = (comment: Comment) => {
        return comment.userName || comment.userEmail;
    };

    const sortedComments = [...(comments || [])].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return (
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />Comments
                                                                    </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {}
                    <div className="flex gap-4">
                        <Avatar className="h-10 w-10 bg-primary/10">
                            <AvatarFallback className="text-primary font-medium">
                                {currentUser?.displayName ? currentUser.displayName.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2) : userEmail.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                            <Textarea
                                placeholder="Add a comment..."
                                className="w-full resize-none"
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                rows={3} />
                            <div className="flex justify-end">
                                <Button
                                    onClick={handleSubmitComment}
                                    disabled={!newComment.trim() || isSubmitting}
                                    size="sm">Add Comment
                                                                                                                            </Button>
                            </div>
                        </div>
                    </div>
                    {sortedComments.length === 0 ? (<div className="text-center py-8 text-muted-foreground">No comments yet. Be the first to add a comment!
                                                                                    </div>) : (<div className="space-y-6">
                        {sortedComments.map(comment => (<div key={comment.id} className="space-y-3">
                            <div className="flex gap-3">
                                <Avatar className="h-8 w-8 bg-primary/10">
                                    <AvatarFallback className="text-primary text-sm font-medium">
                                        {getInitials(comment)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <div className="font-medium text-sm">{getDisplayName(comment)}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(comment.timestamp), {
                                                addSuffix: true
                                            })}
                                        </div>
                                    </div>
                                    <div className="mt-1">{comment.text}</div>
                                    <div className="flex items-center gap-4 mt-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-xs gap-1"
                                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}>
                                            <Reply className="h-3 w-3" />Reply
                                                                                                                                                            </Button>
                                        {comment.userEmail === userEmail && (<Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-xs gap-1 text-destructive hover:text-destructive"
                                            onClick={() => setCommentToDelete({
                                                id: comment.id
                                            })}>
                                            <Trash2 className="h-3 w-3" />Delete
                                                                                                                                                              </Button>)}
                                    </div>
                                </div>
                            </div>
                            {}
                            {replyingTo === comment.id && (<div className="ml-11 mt-2 space-y-2">
                                <Textarea
                                    placeholder="Write a reply..."
                                    className="w-full resize-none"
                                    value={replyText[comment.id] || ""}
                                    onChange={e => setReplyText(prev => ({
                                        ...prev,
                                        [comment.id]: e.target.value
                                    }))}
                                    rows={2} />
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setReplyingTo(null);

                                            setReplyText(prev => ({
                                                ...prev,
                                                [comment.id]: ""
                                            }));
                                        }}>Cancel
                                                                                                                                                </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => handleSubmitReply(comment.id)}
                                        disabled={!replyText[comment.id]?.trim() || isSubmitting}>Reply
                                                                                                                                                </Button>
                                </div>
                            </div>)}
                            {}
                            {comment.replies && comment.replies.length > 0 && (<div className="ml-11 border-l-2 pl-4 border-border/50 space-y-4 mt-3">
                                {comment.replies.map(reply => (<div key={reply.id} className="space-y-1">
                                    <div className="flex gap-3">
                                        <Avatar className="h-6 w-6 bg-secondary">
                                            <AvatarFallback className="text-muted-foreground text-xs font-medium">
                                                {getInitials(reply)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <div className="font-medium text-xs">{getDisplayName(reply)}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(reply.timestamp), {
                                                        addSuffix: true
                                                    })}
                                                </div>
                                            </div>
                                            <div className="mt-1 text-sm">{reply.text}</div>
                                            {reply.userEmail === userEmail && (<Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 text-xs gap-1 text-destructive hover:text-destructive mt-1"
                                                onClick={() => setCommentToDelete({
                                                    id: reply.id,
                                                    parentId: comment.id
                                                })}>
                                                <Trash2 className="h-3 w-3" />Delete
                                                                                                                                                                                </Button>)}
                                        </div>
                                    </div>
                                </div>))}
                            </div>)}
                            <Separator className="mt-4" />
                        </div>))}
                    </div>)}
                </div>
            </CardContent>
            {}
            <AlertDialog
                open={!!commentToDelete}
                onOpenChange={open => !open && setCommentToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone. The comment and any replies will be permanently deleted.
                                                                                                </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteComment}
                            className="bg-destructive text-destructive-foreground">Delete
                                                                                                </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
};

export default CommentSection;