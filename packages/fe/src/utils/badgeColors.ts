export const getEffortBadgeColor = (effort?: string) => {
  switch (effort) {
    case "high":
      return "bg-red-100 text-red-800";
    case "med":
      return "bg-yellow-100 text-yellow-800";
    case "low":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getStatusBadgeColor = (status?: string) => {
  switch (status) {
    case "todo":
      return "bg-gray-100 text-gray-800";
    case "in progress":
      return "bg-blue-100 text-blue-800";
    case "blocked":
      return "bg-red-100 text-red-800";
    case "done":
    case "completed":
      return "bg-green-100 text-green-800";
    case "not done":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getCategoryBadgeColor = (category: string) => {
  const colors = {
    Main: "bg-purple-100 text-purple-800",
    Yearly: "bg-blue-100 text-blue-800",
    Quarterly: "bg-green-100 text-green-800",
    Monthly: "bg-yellow-100 text-yellow-800",
    Weekly: "bg-orange-100 text-orange-800",
    Daily: "bg-red-100 text-red-800",
  };
  return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800";
};

export const getPriorityBadgeColor = (priority?: string) => {
  switch (priority) {
    case "high":
      return "bg-purple-100 text-purple-800";
    case "med":
      return "bg-pink-100 text-pink-800";
    case "low":
      return "bg-indigo-100 text-indigo-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
