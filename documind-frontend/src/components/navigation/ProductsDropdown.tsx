import { Link } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Layers,
  Network,
  LockKeyhole,
  GitBranch,
  Activity,
  Tablet,
  ArrowRight,
} from "lucide-react";

const ProductsDropdown = () => {
  const productSections = [
    {
      title: "Core Features",
      items: [
        {
          name: "Features",
          description: "Document analysis tools",
          icon: Layers,
          href: "/products/features",
        },
        {
          name: "Intelligence",
          description: "Advanced RAG technology",
          icon: Network,
          href: "/products/ai",
        },
      ],
    },
    {
      title: "Platform",
      items: [
        {
          name: "Security",
          description: "Enterprise security & compliance",
          icon: LockKeyhole,
          href: "/products/security",
        },
        {
          name: "Integrations",
          description: "Connect existing tools",
          icon: GitBranch,
          href: "/products/integrations",
        },
      ],
    },
    {
      title: "Analytics & Mobile",
      items: [
        {
          name: "Analytics",
          description: "Usage tracking & insights",
          icon: Activity,
          href: "/products/analytics",
        },
        {
          name: "Mobile",
          description: "Access anywhere",
          icon: Tablet,
          href: "/products/mobile",
        },
      ],
    },
  ];

  return (
    <NavigationMenu viewportClassName="!bg-transparent !border-0 !shadow-none">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-xs font-medium text-white/60 hover:text-white transition-colors bg-transparent hover:bg-transparent data-[state=open]:bg-transparent data-[active]:bg-transparent px-0 h-auto py-0">
            Products
          </NavigationMenuTrigger>
          <NavigationMenuContent className="!left-0">
            <div className="w-[480px] bg-black border border-white/[0.08] rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden">
              {/* Content Grid */}
              <div className="p-4">
                <div className="grid grid-cols-3 gap-x-6 relative">
                  {productSections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="relative">
                      {/* Vertical Separator */}
                      {sectionIndex > 0 && (
                        <div className="absolute -left-3 top-0 bottom-0 w-[1px] bg-white/[0.12]" />
                      )}
                      <div>
                        <h3 className="text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] mb-2.5 leading-none">
                          {section.title}
                        </h3>
                        <ul className="space-y-0.5">
                          {section.items.map((item) => {
                            const Icon = item.icon;
                            return (
                              <li key={item.name}>
                                <Link
                                  to={item.href}
                                  className="group relative flex items-center gap-2 px-2 py-2 -mx-2 rounded-md transition-all duration-150 hover:bg-white/[0.025]"
                                >
                                  {/* Icon Container */}
                                  <div className="relative flex-shrink-0">
                                    <div className="w-6 h-6 rounded-md bg-white/[0.03] border border-white/[0.05] group-hover:bg-white/[0.05] group-hover:border-white/[0.08] transition-all duration-150 flex items-center justify-center">
                                      <Icon className="w-3 h-3 text-white/60 group-hover:text-white/80 transition-colors duration-150" />
                                    </div>
                                  </div>
                                  
                                  {/* Text Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 mb-0.5">
                                      <span className="text-xs font-medium text-white/95 group-hover:text-white transition-colors duration-150 leading-tight tracking-[-0.01em]">
                                        {item.name}
                                      </span>
                                      <ArrowRight className="w-2.5 h-2.5 text-white/0 group-hover:text-white/35 group-hover:translate-x-0.5 transition-all duration-150 opacity-0 group-hover:opacity-100 flex-shrink-0" />
                                    </div>
                                    <p className="text-[10px] text-white/45 group-hover:text-white/55 transition-colors duration-150 leading-snug truncate">
                                      {item.description}
                                    </p>
                                  </div>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-white/[0.04] bg-white/[0.005]">
                <Link
                  to="/products"
                  className="group inline-flex items-center gap-1.5 text-[10px] font-medium text-white/55 hover:text-white/80 transition-colors duration-150"
                >
                  <span>View all products</span>
                  <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform duration-150" />
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

