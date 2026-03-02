import { MainViewType, getMainViewTypeLabel } from '../../types/MainViewType'
import { SECTIONS } from './gameViewSections'

/**
 * Props for the GameViewSidebar component.
 */
export interface GameViewSidebarProps {
  /** Currently active section. */
  activeSection: MainViewType
  /** Called when the user selects a section. */
  onSelectSection: (section: MainViewType) => void
}

/**
 * Sidebar navigation for the game view. Lists sections from SECTIONS;
 * clicking an item sets it as active and the parent renders that section's content.
 * On narrow viewports, shows as a horizontal scrollable bar; on wider viewports, a vertical sidebar.
 *
 * @param props.activeSection - The currently active section.
 * @param props.onSelectSection - Callback when a section is selected.
 * @returns A JSX element representing the GameViewSidebar component.
 */
export function GameViewSidebar({
  activeSection,
  onSelectSection,
}: GameViewSidebarProps): JSX.Element {
  return (
    <nav
      className="flex shrink-0 flex-col border-slate-200 bg-white py-2 md:w-48 md:border-r"
      aria-label="Game sections"
    >
      <div className="flex overflow-x-auto md:flex-col md:overflow-x-visible">
        {SECTIONS.map((section) => {
          const isActive = activeSection === section
          return (
            <button
              key={section}
              type="button"
              onClick={() => onSelectSection(section)}
              className={`shrink-0 px-3 py-2 text-sm transition-colors md:px-4 md:text-left ${
                isActive
                  ? 'bg-slate-100 font-medium text-slate-900'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
              aria-current={isActive ? 'true' : undefined}
            >
              {getMainViewTypeLabel(section)}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
