import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Truck,
  Package,
  ClipboardList,
  RefreshCw,
  Award,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#E3253D] rounded-lg flex items-center justify-center">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center">
                <span className="text-2xl font-bold text-[#10294B]">Tru</span>
                <span className="text-2xl font-bold text-[#E3253D]">X</span>
                <span className="text-2xl font-bold text-[#10294B]">toK</span>
                <span className="text-sm ml-1">™</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button asChild variant="outline">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#10294B] via-[#1a3a5c] to-[#006AA1] text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-[#E3253D] hover:bg-[#E3253D]/90 text-white px-4 py-2">
                  🚀 Inventory Management Made Simple
                </Badge>
                <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                  <span className="text-white">Smart</span>{" "}
                  <span className="text-[#E3253D]">Truck</span>
                  <br />
                  <span className="text-white">Inventory</span>
                </h1>
                <p className="text-xl lg:text-2xl text-blue-100 max-w-2xl">
                  Streamline your truck inventory management with automated
                  restocking suggestions and seamless order processing.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-[#E3253D] hover:bg-[#E3253D]/90 text-white px-8 py-4 text-lg"
                >
                  <Link href="/login">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#E3253D]">500+</div>
                  <div className="text-sm text-blue-200">Active Trucks</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#E3253D]">10K+</div>
                  <div className="text-sm text-blue-200">Items Managed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#E3253D]">98%</div>
                  <div className="text-sm text-blue-200">Accuracy Rate</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">Truck Dashboard</h3>
                    <Badge className="bg-green-500">Live Demo</Badge>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white/20 rounded-lg p-4">
                      <div className="text-sm text-blue-200 mb-1">Truck ID</div>
                      <div className="text-white font-medium">TRUCK-001</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/20 rounded-lg p-4">
                        <div className="text-sm text-blue-200 mb-1">Items</div>
                        <div className="text-white font-medium">156</div>
                      </div>
                      <div className="bg-white/20 rounded-lg p-4">
                        <div className="text-sm text-blue-200 mb-1">
                          Low Stock
                        </div>
                        <div className="text-white font-medium">12</div>
                      </div>
                    </div>
                    <div className="bg-green-500/20 rounded-lg p-4 border border-green-400/30">
                      <div className="text-sm text-green-200 mb-1">
                        Restock Suggestions
                      </div>
                      <div className="text-green-300 font-bold text-lg">
                        Ready
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-72 h-72 bg-[#E3253D]/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-[#006AA1]/20 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-[#10294B] text-white mb-4">Features</Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-[#10294B] mb-6">
              Everything You Need to{" "}
              <span className="text-[#E3253D]">Manage</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built specifically for technicians and fleet managers, TruXtoK
              streamlines inventory management with intelligent automation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {[
              {
                icon: Truck,
                title: "Truck Management",
                description:
                  "Organize and track inventory across multiple trucks with bin-level precision.",
                color: "bg-[#006AA1]",
              },
              {
                icon: Package,
                title: "Smart Inventory",
                description:
                  "Real-time inventory tracking with standard level comparisons and alerts.",
                color: "bg-[#E3253D]",
              },
              {
                icon: RefreshCw,
                title: "Auto Restock",
                description:
                  "Intelligent restocking suggestions based on usage patterns and standard levels.",
                color: "bg-[#10294B]",
              },
              {
                icon: ClipboardList,
                title: "Easy Ordering",
                description:
                  "Streamlined manual ordering with PDF generation and email integration.",
                color: "bg-[#006AA1]",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-2"
              >
                <CardHeader className="text-center pb-4">
                  <div
                    className={`mx-auto w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-[#10294B] group-hover:text-[#E3253D] transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-[#10294B] to-[#006AA1] text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { number: "500+", label: "Active Trucks", icon: Truck },
              { number: "10K+", label: "Items Managed", icon: Package },
              { number: "50+", label: "Companies", icon: BarChart3 },
              { number: "98%", label: "Accuracy Rate", icon: Award },
            ].map((stat, index) => (
              <div key={index} className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <stat.icon className="h-8 w-8 text-[#E3253D]" />
                </div>
                <div className="text-4xl font-bold text-[#E3253D]">
                  {stat.number}
                </div>
                <div className="text-blue-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-[#10294B] via-[#1a3a5c] to-[#006AA1] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <Badge className="bg-[#E3253D] text-white px-6 py-3 text-lg">
              🎉 Ready to Get Started?
            </Badge>
            <h2 className="text-4xl lg:text-6xl font-bold leading-tight">
              Transform Your <span className="text-[#E3253D]">Inventory</span>
            </h2>
            <p className="text-xl lg:text-2xl text-blue-100 max-w-2xl mx-auto">
              Join hundreds of technicians already streamlining their inventory
              management with TruXtoK.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
              <Button
                asChild
                size="lg"
                className="bg-[#E3253D] hover:bg-[#E3253D]/90 text-white px-12 py-6 text-xl"
              >
                <Link href="/login">
                  Start Managing
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#10294B] text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#E3253D] rounded-lg flex items-center justify-center">
                  <Truck className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center">
                  <span className="text-2xl font-bold">Tru</span>
                  <span className="text-2xl font-bold text-[#E3253D]">X</span>
                  <span className="text-2xl font-bold">toK</span>
                  <span className="text-sm ml-1">™</span>
                </div>
              </div>
              <p className="text-blue-200">Smart Truck Inventory Management</p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-blue-200">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    API
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-blue-200">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-blue-200">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Status
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-blue-800 pt-8 text-center text-blue-200">
            <p>&copy; 2024 TruXtoK. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
