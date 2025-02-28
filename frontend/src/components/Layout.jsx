import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Button } from './ui/button';
import { Card } from './ui/card';

export default function Layout() {
  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b-2 border-black">
        <nav className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold mr-8">
              <NavLink to="/" className="text-black hover:text-mainAccent transition-colors">
                AI Journal
              </NavLink>
            </h1>
            <div className="hidden sm:flex gap-4">
              <NavLink 
                to="/" 
                className={({ isActive }) => 
                  isActive 
                    ? "font-medium text-mainAccent border-b-2 border-mainAccent"
                    : "font-medium text-black hover:text-mainAccent transition-colors"
                }
                end
              >
                Journal Entries
              </NavLink>
              <NavLink 
                to="/chat" 
                className={({ isActive }) => 
                  isActive 
                    ? "font-medium text-mainAccent border-b-2 border-mainAccent"
                    : "font-medium text-black hover:text-mainAccent transition-colors"
                }
              >
                AI Assistant
              </NavLink>
            </div>
          </div>
        </nav>
      </header>
      
      <main className="container mx-auto max-w-6xl p-4">
        <Outlet />
      </main>
      
      <footer className="border-t-2 border-black py-6 bg-bg mt-12">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-gray-600 mb-4 sm:mb-0">
              © {new Date().getFullYear()} AI Journal. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-sm text-black hover:text-mainAccent transition-colors">Privacy Policy</a>
              <a href="#" className="text-sm text-black hover:text-mainAccent transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}