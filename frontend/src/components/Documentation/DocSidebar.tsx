import { motion } from 'framer-motion'
import { DocSection } from './Documentation'
import clsx from 'clsx'

interface DocSidebarProps {
  sections: DocSection[]
  selectedSection: string
  onSelectSection: (sectionId: string) => void
  searchQuery: string
}

export function DocSidebar({ sections, selectedSection, onSelectSection, searchQuery }: DocSidebarProps) {
  const filterSections = (sections: DocSection[]): DocSection[] => {
    if (!searchQuery) return sections
    
    return sections.filter(section => {
      const matchesTitle = section.title.toLowerCase().includes(searchQuery.toLowerCase())
      const hasMatchingSubsections = section.subsections?.some(sub => 
        sub.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
      return matchesTitle || hasMatchingSubsections
    })
  }
  
  const filteredSections = filterSections(sections)
  
  return (
    <div className="w-64 border-r border-border bg-background/50 overflow-y-auto">
      <nav className="p-4">
        {filteredSections.map((section, index) => (
          <div key={section.id} className={index > 0 ? 'mt-6' : ''}>
            <motion.button
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectSection(section.id)}
              className={clsx(
                'w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2',
                selectedSection === section.id
                  ? 'bg-primary/20 text-primary font-medium'
                  : 'hover:bg-accent/50 text-foreground'
              )}
            >
              {section.icon && <section.icon size={16} />}
              {section.title}
            </motion.button>
            
            {/* Subsections */}
            {section.subsections && (
              <div className="ml-4 mt-1 space-y-1">
                {section.subsections
                  .filter(sub => !searchQuery || sub.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(subsection => (
                    <motion.button
                      key={subsection.id}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onSelectSection(subsection.id)}
                      className={clsx(
                        'w-full text-left px-3 py-1.5 rounded-md transition-all text-sm',
                        selectedSection === subsection.id
                          ? 'bg-primary/20 text-primary font-medium'
                          : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {subsection.title}
                    </motion.button>
                  ))}
              </div>
            )}
          </div>
        ))}
        
        {filteredSections.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-8">
            No results found for "{searchQuery}"
          </p>
        )}
      </nav>
    </div>
  )
}