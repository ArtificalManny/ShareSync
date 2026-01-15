import React from 'react';

/**
 * EmptyStateIcons - Icon Library for Empty States
 * 
 * Pre-built icons sized perfectly for EmptyState component (w-12 h-12)
 * Uses lucide-react for consistency with your existing icon system
 */

import {
  Rocket,
  FolderOpen,
  Users,
  Search,
  CheckCircle2,
  Inbox,
  Target,
  AlertCircle,
  Zap,
  FileText,
  Calendar,
  Bell,
  TrendingUp,
  Package,
  Archive
} from 'lucide-react';

// Projects
export const RocketIcon = () => <Rocket className="w-12 h-12" strokeWidth={1.5} />;
export const FolderIcon = () => <FolderOpen className="w-12 h-12" strokeWidth={1.5} />;
export const TargetIcon = () => <Target className="w-12 h-12" strokeWidth={1.5} />;

// Team
export const TeamIcon = () => <Users className="w-12 h-12" strokeWidth={1.5} />;

// Search/Filter
export const SearchIcon = () => <Search className="w-12 h-12" strokeWidth={1.5} />;

// Status
export const CheckIcon = () => <CheckCircle2 className="w-12 h-12" strokeWidth={1.5} />;
export const InboxIcon = () => <Inbox className="w-12 h-12" strokeWidth={1.5} />;
export const AlertIcon = () => <AlertCircle className="w-12 h-12" strokeWidth={1.5} />;

// Actions
export const ZapIcon = () => <Zap className="w-12 h-12" strokeWidth={1.5} />;
export const TrendingIcon = () => <TrendingUp className="w-12 h-12" strokeWidth={1.5} />;

// Content
export const FileIcon = () => <FileText className="w-12 h-12" strokeWidth={1.5} />;
export const CalendarIcon = () => <Calendar className="w-12 h-12" strokeWidth={1.5} />;
export const BellIcon = () => <Bell className="w-12 h-12" strokeWidth={1.5} />;
export const PackageIcon = () => <Package className="w-12 h-12" strokeWidth={1.5} />;
export const ArchiveIcon = () => <Archive className="w-12 h-12" strokeWidth={1.5} />;

export default {
  RocketIcon,
  FolderIcon,
  TargetIcon,
  TeamIcon,
  SearchIcon,
  CheckIcon,
  InboxIcon,
  AlertIcon,
  ZapIcon,
  TrendingIcon,
  FileIcon,
  CalendarIcon,
  BellIcon,
  PackageIcon,
  ArchiveIcon,
};
