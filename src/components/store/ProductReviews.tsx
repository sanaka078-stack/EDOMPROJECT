import { useState, useEffect } from "react";
import { Star, User, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Review {
  id: string;
  product_id: string;
  user_id: string | null;
  customer_name: string;
  rating: number;
  title: string | null;
  content: string | null;
  is_verified: boolean;
  is_approved: boolean;
  created_at: string;
}

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews" as any)
        .select("*")
        .eq("product_id", productId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setReviews(data as unknown as Review[]);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
    setLoading(false);
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error("Please login to submit a review");
      return;
    }

    if (rating < 1 || rating > 5) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);

    try {
      // Get user profile for name
      const { data: profile } = await supabase
        .from("profiles" as any)
        .select("full_name, email")
        .eq("user_id", user.id)
        .single();

      const customerName = (profile as any)?.full_name || (profile as any)?.email?.split("@")[0] || "Anonymous";

      // Check if user has purchased this product
      let isVerified = false;
      try {
        const { data: orders } = await supabase
          .from("orders" as any)
          .select("id")
          .eq("user_id", user.id);

        if (orders && orders.length > 0) {
          const orderIds = (orders as any[]).map(o => o.id);
          const { data: orderItems } = await supabase
            .from("order_items" as any)
            .select("product_id")
            .in("order_id", orderIds)
            .eq("product_id", productId);
          
          isVerified = (orderItems?.length ?? 0) > 0;
        }
      } catch (err) {
        console.error("Error checking purchase:", err);
      }

      const { error } = await supabase.from("reviews" as any).insert({
        product_id: productId,
        user_id: user.id,
        customer_name: customerName,
        rating,
        title: title || null,
        content: content || null,
        is_verified: isVerified,
        is_approved: false, // Needs admin approval
      });

      if (error) throw error;

      toast.success("Review submitted! It will appear after approval.");
      setShowForm(false);
      setRating(5);
      setTitle("");
      setContent("");
      fetchReviews();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate rating distribution
  const ratingCounts = [5, 4, 3, 2, 1].map(
    (r) => reviews.filter((review) => review.rating === r).length
  );
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  const StarRating = ({ value, interactive = false }: { value: number; interactive?: boolean }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-5 w-5 ${
            star <= (interactive ? hoverRating || rating : value)
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground"
          } ${interactive ? "cursor-pointer transition-colors" : ""}`}
          onClick={() => interactive && setRating(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
        />
      ))}
    </div>
  );

  if (loading) {
    return <div className="animate-pulse h-40 bg-muted rounded-lg" />;
  }

  return (
    <div className="space-y-8">
      {/* Summary Section */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="text-center md:text-left">
          <div className="flex items-center gap-4 justify-center md:justify-start mb-4">
            <span className="text-5xl font-bold">{averageRating.toFixed(1)}</span>
            <div>
              <StarRating value={Math.round(averageRating)} />
              <p className="text-sm text-muted-foreground mt-1">
                {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
              </p>
            </div>
          </div>
          {user && (
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-store-primary hover:bg-store-primary/90"
            >
              Write a Review
            </Button>
          )}
          {!user && (
            <p className="text-sm text-muted-foreground">
              Please <a href="/store/login" className="text-store-primary hover:underline">login</a> to write a review
            </p>
          )}
        </div>

        {/* Rating Distribution */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((star, idx) => (
            <div key={star} className="flex items-center gap-3">
              <span className="text-sm w-8">{star} star</span>
              <Progress
                value={totalReviews > 0 ? (ratingCounts[idx] / totalReviews) * 100 : 0}
                className="flex-1 h-2"
              />
              <span className="text-sm text-muted-foreground w-8">
                {ratingCounts[idx]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Review Form */}
      {showForm && (
        <div className="p-6 border rounded-lg bg-store-card">
          <h4 className="font-semibold mb-4">Write Your Review</h4>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Rating</label>
              <StarRating value={rating} interactive />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Title (optional)</label>
              <Input
                placeholder="Summarize your experience"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Review</label>
              <Textarea
                placeholder="Tell others about your experience..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleSubmitReview}
                disabled={submitting}
                className="bg-store-primary hover:bg-store-primary/90"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <Separator />

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No reviews yet. Be the first to review this product!
        </p>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-store-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{review.customer_name}</span>
                      {review.is_verified && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified Purchase
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <StarRating value={review.rating} />
              </div>
              {review.title && (
                <h5 className="font-medium mb-2">{review.title}</h5>
              )}
              {review.content && (
                <p className="text-muted-foreground">{review.content}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
