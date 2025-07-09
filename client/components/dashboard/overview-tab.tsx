import { DollarSign, Eye, Heart, TrendingUp } from "lucide-react";
import { TabsContent } from "../ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";

// Mock data
const statsData = [
  { name: "Jan", earnings: 120, views: 2400 },
  { name: "Feb", earnings: 190, views: 1398 },
  { name: "Mar", earnings: 300, views: 9800 },
  { name: "Apr", earnings: 280, views: 3908 },
  { name: "May", earnings: 450, views: 4800 },
  { name: "Jun", earnings: 380, views: 3800 },
];

const OverViewTab = ({ value }: { value: string }) => {
  const myPrompts = [
    {
      id: 1,
      title: "Professional LinkedIn Post Generator",
      category: "Marketing",
      type: "free",
      views: 1234,
      likes: 89,
      comments: 23,
      earnings: 0,
      status: "published",
      createdAt: "2024-01-15",
    },
    {
      id: 2,
      title: "Logo Design Prompts Collection",
      category: "Design",
      type: "paid",
      price: 12.99,
      views: 567,
      likes: 45,
      comments: 12,
      earnings: 156.87,
      status: "published",
      createdAt: "2024-01-10",
    },
    {
      id: 3,
      title: "Code Review Assistant",
      category: "Programming",
      type: "free",
      views: 890,
      likes: 67,
      comments: 18,
      earnings: 0,
      status: "draft",
      createdAt: "2024-01-20",
    },
  ];

  const totalEarnings = myPrompts.reduce(
    (sum, prompt) => sum + prompt.earnings,
    0
  );
  const totalViews = myPrompts.reduce((sum, prompt) => sum + prompt.views, 0);
  const totalLikes = myPrompts.reduce((sum, prompt) => sum + prompt.likes, 0);
  const publishedPrompts = myPrompts.filter(
    (p) => p.status === "published"
  ).length;

  return (
    <TabsContent value={value} className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Earnings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalEarnings.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalViews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLikes}</div>
            <p className="text-xs text-muted-foreground">
              +15% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Published Prompts
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedPrompts}</div>
            <p className="text-xs text-muted-foreground">
              {myPrompts.length - publishedPrompts} drafts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-neutral-50 dark:bg-neutral-900 backdrop-blur-sm border-slate-200/60 dark:border-slate-800/60 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg mr-3">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              Earnings Overview
            </CardTitle>
            <CardDescription>Monthly earnings performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={statsData}>
                <defs>
                  <linearGradient
                    id="earningsGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="earnings"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#earningsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-neutral-50 dark:bg-neutral-900 backdrop-blur-sm border-slate-200/60 dark:border-slate-800/60 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg mr-3">
                <Eye className="h-4 w-4 text-white" />
              </div>
              Views & Engagement
            </CardTitle>
            <CardDescription>
              Monthly views and engagement trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={statsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="engagement"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest prompt interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                action: "New comment",
                prompt: "LinkedIn Post Generator",
                time: "2 hours ago",
              },
              {
                action: "Prompt purchased",
                prompt: "Logo Design Collection",
                time: "5 hours ago",
              },
              {
                action: "New like",
                prompt: "Code Review Assistant",
                time: "1 day ago",
              },
              {
                action: "Prompt viewed",
                prompt: "LinkedIn Post Generator",
                time: "2 days ago",
              },
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.prompt}</p>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
};

export default OverViewTab;
