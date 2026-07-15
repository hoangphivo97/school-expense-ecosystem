import { NavItem } from "../enums/nav.enum";

export interface NavItemConfig{
  key: NavItem;
  label: string;
  icon: string;
  children?: SubNavItemConfig[];
}

export interface SubNavItemConfig {
  label: string;
  route: string;
  icon: string;
}
