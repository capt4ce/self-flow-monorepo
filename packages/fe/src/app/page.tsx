"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SignIn, SignUp } from "@clerk/nextjs";
import { api } from "@/lib/api-client";
import { GoalDTO, GoalStatus, GoalCategory } from "@self-flow/common/types";
import { Button } from "@/components/ui/button";
import { PlusCircle, Plus } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const [goals, setGoals] = useState<GoalDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSignIn, setShowSignIn] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      fetchGoals();
    } else if (!loading && !user) {
      setIsLoading(false);
    }
  }, [user, loading]);

  const fetchGoals = async () => {
    try {
      const response = await api.goals.list("active");
      setGoals(response.data);
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {showSignIn ? (
            <div>
              <SignIn />
              <div className="mt-4 text-center">
                <Button
                  variant="link"
                  onClick={() => setShowSignIn(false)}
                  className="text-sm"
                >
                  Don't have an account? Sign up
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <SignUp />
              <div className="mt-4 text-center">
                <Button
                  variant="link"
                  onClick={() => setShowSignIn(true)}
                  className="text-sm"
                >
                  Already have an account? Sign in
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const allCategories: GoalCategory[] = [
    "Main",
    "Yearly",
    "Quarterly",
    "Monthly",
    "Weekly",
    "Daily",
  ];

  const groupedGoals = allCategories.reduce((acc, category) => {
    acc[category] = goals.filter((goal) => goal.category === category);
    return acc;
  }, {} as Record<GoalCategory, GoalDTO[]>);

  return (
    <div className="min-h-screen bg-background p-6">
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your goals and progress
            </p>
          </div>
          <Button
            onClick={() => {}}
            className="flex items-center gap-2"
          >
            <PlusCircle size={16} />
            Add Goal
          </Button>
        </div>
      </header>

      <div className="space-y-8">
        {Object.entries(groupedGoals).map(([category, categoryGoals]) => (
          <div key={category} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-muted-foreground">
                {category}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {}}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add {category} Goal
              </Button>
            </div>

            {categoryGoals.length > 0 ? (
              <div className="border-gray-200 border-2 rounded-lg p-4">
                {categoryGoals.map((goal) => (
                  <div key={goal.id} className="mb-4 last:mb-0">
                    <h4 className="font-semibold">{goal.title}</h4>
                    {goal.description && (
                      <p className="text-sm text-muted-foreground">
                        {goal.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-gray-200 rounded-lg">
                No {category.toLowerCase()} goals yet.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
