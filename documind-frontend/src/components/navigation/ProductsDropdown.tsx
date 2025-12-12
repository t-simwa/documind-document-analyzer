import { Link } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sparkles,
  Brain,
  Shield,
  Plug,
  BarChart3,
  Smartphone,
} from "lucide-react";

const ProductsDropdown = () => {
  const productSections = [
    {
      title: "Core Features",
      items: [
        {
          name: "Features",
          description: "Powerful tools for document analysis",
          icon: Sparkles,
          href: "/products/features",
        },
        {
          name: "AI & Intelligence",
          description: "Advanced AI capabilities and RAG technology",
          icon: Brain,
          href: "/products/ai",
        },
      ],
    },
    {
      title: "Platform",
      items: [
        {
          name: "Security",
          description: "Enterprise-grade security and compliance",
          icon: Shield,
          href: "/products/security",
        },
        {
          name: "Integrations",
          description: "Connect with your existing tools",
          icon: Plug,
          href: "/products/integrations",
        },
      ],
    },
    {
      title: "Analytics & Mobile",
      items: [
        {
          name: "Analytics",
          description: "Track usage and gain insights",
          icon: BarChart3,
          href: "/products/analytics",
        },
        {
          name: "Mobile",
          description: "Access from anywhere",
          icon: Smartphone,
          href: "/products/mobile",
        },
      ],
    },
  ];

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-sm font-medium text-white/60 hover:text-white transition-colors bg-transparent hover:bg-transparent data-[state=open]:bg-transparent data-[active]:bg-transparent px-0 h-auto py-0">
            Products
          </NavigationMenuTrigger>
          <NavigationMenuContent className="!left-0">
            <div className="w-[600px] p-6 bg-black border border-white/10 rounded-lg shadow-xl">
              <div className="grid grid-cols-3 gap-8">
                {productSections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="space-y-4">
                    <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">
                      {section.title}
                    </h3>
                    <ul className="space-y-3">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <li key={item.name}>
                            <Link
                              to={item.href}
                              className="group flex flex-col gap-1 p-3 rounded-lg hover:bg-white/5 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                  <Icon className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-sm font-medium text-white group-hover:text-white">
                                  {item.name}
                                </span>
                              </div>
                              <p className="text-xs text-white/60 ml-11">
                                {item.description}
                              </p>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-white/10">
                <Link
                  to="/products"
                  className="text-sm text-white/60 hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  View all products <span className="text-white/40">→</span>
                </Link>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default ProductsDropdown;

