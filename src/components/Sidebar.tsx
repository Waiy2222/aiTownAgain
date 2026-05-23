export interface TabDef {
  id: string;
  label: string;
}

export default function Sidebar({
  tabs,
  activeTab,
  onTabChange,
  children,
  scrollViewRef,
}: {
  tabs: TabDef[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
  scrollViewRef?: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div
      className="flex flex-col overflow-y-auto shrink-0 px-4 py-4 sm:px-6 lg:w-96 xl:pr-6 border-t-8 sm:border-t-0 sm:border-l-8 border-brown-900 bg-brown-800 text-brown-100"
      ref={scrollViewRef}
    >
      <nav className="flex gap-1 mb-4 sidebar-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`sidebar-tab text-sm sm:text-base px-3 py-1.5 font-body tracking-wide transition-colors ${
              activeTab === tab.id
                ? 'sidebar-tab-active bg-brown-700 text-brown-100'
                : 'text-brown-300 hover:text-brown-100 hover:bg-brown-700/50'
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}
