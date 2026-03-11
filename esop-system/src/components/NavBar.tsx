'use client'

import { RoleSwitcher } from "./RoleSwitcher";
import { useNavRole, getNavItems } from "@/lib/nav-config";

export function NavBar() {
  const role = useNavRole();
  const navItems = getNavItems(role);

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="text-xl font-bold text-gray-900">
          📊 股权激励系统
        </div>
        <div className="flex items-center gap-6">
          <div className="flex gap-6 text-sm">
            {navItems.map((item) => (
              <a 
                key={item.path}
                href={item.path} 
                className="text-gray-600 hover:text-gray-900"
              >
                {item.label}
              </a>
            ))}
          </div>
          <RoleSwitcher />
        </div>
      </div>
    </nav>
  );
}