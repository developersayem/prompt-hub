import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  Sparkles,
  Users,
  DollarSign,
  Shield,
  Star,
  TrendingUp,
  Zap,
  Facebook,
  Github,
  Instagram,
  Linkedin,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950  relative overflow-hidden">
      {/* Header */}
      <header className="border-b bg-transparent backdrop-blur-md sticky top-0 z-50 border-accent transition-colors duration-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Sparkles className="h-8 w-8 text-blue-600 relative z-10" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PromptHub
              </span>
              <div className="text-xs text-slate-500 font-medium">
                AI Prompt Directory
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link href="/auth/login">
              <Button
                variant="ghost"
                className="font-medium text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-medium">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-700/25 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgb(15,23,42),rgba(15,23,42,0.6))] transition-all duration-300"></div>
        <div className="container mx-auto text-center relative">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 mb-8">
            <Zap className="h-4 w-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Join 50,000+ AI creators worldwide
            </span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold text-slate-900 dark:text-white mb-8 leading-tight">
            The Future of
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI Prompts
            </span>
          </h1>

          <p className="text-xl text-slate-600 dark:text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            Discover, create, and monetize the world&apos;s best AI prompts.
            Join the largest marketplace for ChatGPT, DALL-E, Midjourney, and
            more. Turn your creativity into income.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="text-lg px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
              >
                Start Creating <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/feed">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-4 border-2 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Explore Prompts
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                50K+
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Active Creators
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                1M+
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Prompts Created
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                $2M+
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Creator Earnings
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                4.9★
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                User Rating
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 bg-accent relative transition-colors duration-200">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Why Choose Prompt Hub?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              The most advanced platform for AI prompt creators and enthusiasts
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="w-full">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Global Community</CardTitle>
                <CardDescription className="text-base">
                  Connect with 50,000+ AI creators worldwide
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  Join the largest community of AI prompt creators. Share
                  knowledge, collaborate, and learn from the best in the
                  industry.
                </p>
              </CardContent>
            </Card>

            <Card className="w-full">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">
                  Monetize Your Creativity
                </CardTitle>
                <CardDescription className="text-base">
                  Earn up to 90% revenue from your premium prompts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  Set your own prices and keep 90% of revenue. Our creators have
                  earned over $2M selling their AI prompts on PromptHub.
                </p>
              </CardContent>
            </Card>

            <Card className="w-full ">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Enterprise Security</CardTitle>
                <CardDescription className="text-base">
                  Bank-grade security with Stripe payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  All transactions are secured with enterprise-grade encryption.
                  Content is moderated for quality and safety purposes.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 border rounded-xl">
              <Star className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                Quality Assured
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                All prompts are reviewed for quality
              </p>
            </div>
            <div className="text-center p-6 border rounded-xl">
              <TrendingUp className="h-8 w-8 text-blue-500 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                Trending Insights
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Discover what&apos;s popular in AI
              </p>
            </div>
            <div className="text-center p-6 border rounded-xl">
              <Zap className="h-8 w-8 text-purple-500 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                Instant Access
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Download prompts immediately
              </p>
            </div>
            <div className="text-center p-6 border rounded-xl">
              <Sparkles className="h-8 w-8 text-pink-500 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                AI Playground
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Test prompts before publishing
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white relative overflow-hidden">
        <div className="container mx-auto text-center relative z-10">
          <h2 className="text-4xl font-bold mb-6">
            Trusted by Industry Leaders
          </h2>
          <p className="text-xl mb-12 opacity-90">
            Join thousands of creators already earning from their AI prompts
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-3xl font-bold mb-2">$50K+</div>
              <div className="text-lg opacity-90">Average creator earnings</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div className="text-lg opacity-90">Customer support</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-3xl font-bold mb-2">99.9%</div>
              <div className="text-lg opacity-90">Platform uptime</div>
            </div>
          </div>

          <Link href="/auth/signup">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8 py-4 bg-white text-slate-900 hover:bg-slate-100"
            >
              Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 dark:bg-neutral-950 text-white py-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <Sparkles className="h-8 w-8 text-blue-500" />
                <span className="text-2xl font-bold">Prompt Hub</span>
              </div>
              <p className="text-slate-400 mb-6 max-w-md">
                The world&apos;s largest marketplace for AI prompts. Create,
                discover, and monetize the best prompts for ChatGPT, DALL-E,
                Midjourney, and more.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="icon" className="size-8">
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="size-8">
                  <Instagram className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="size-8">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 1200 1227"
                    fill="currentColor"
                  >
                    <path d="M714 558L1177 0H1071L672 486 343 0H0L486 720 0 1227H106L529 714l346 513h343L714 558z" />
                  </svg>
                </Button>
                <Button variant="ghost" size="icon" className="size-8">
                  <Linkedin className="h-4 w-4 font-bold" />
                </Button>
                <Button variant="ghost" size="icon" className="size-8">
                  <Github className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-white">Platform</h3>
              <ul className="space-y-3 text-slate-400">
                <li>
                  <Link
                    href="/browse"
                    className="hover:text-white transition-colors"
                  >
                    Browse Prompts
                  </Link>
                </li>
                <li>
                  <Link
                    href="/categories"
                    className="hover:text-white transition-colors"
                  >
                    Categories
                  </Link>
                </li>
                <li>
                  <Link
                    href="/creators"
                    className="hover:text-white transition-colors"
                  >
                    Top Creators
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="hover:text-white transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-white">Community</h3>
              <ul className="space-y-3 text-slate-400">
                <li>
                  <Link
                    href="/blog"
                    className="hover:text-white transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/help"
                    className="hover:text-white transition-colors"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="/discord"
                    className="hover:text-white transition-colors"
                  >
                    Discord
                  </Link>
                </li>
                <li>
                  <Link
                    href="/newsletter"
                    className="hover:text-white transition-colors"
                  >
                    Newsletter
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-white">Company</h3>
              <ul className="space-y-3 text-slate-400">
                <li>
                  <Link
                    href="/about"
                    className="hover:text-white transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/careers"
                    className="hover:text-white transition-colors"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-white transition-colors"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-white transition-colors"
                  >
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 text-sm">
              &copy; 2025 PromptHub. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <span className="text-slate-400 text-sm">
                Made with ❤️ for AI creators
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
