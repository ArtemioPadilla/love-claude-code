import { motion } from 'framer-motion'
import { DocSection } from './Documentation'

interface DocContentProps {
  section: DocSection
}

export function DocContent({ section }: DocContentProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <motion.div
        key={section.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-8 max-w-4xl mx-auto"
      >
        <div className="prose prose-invert max-w-none">
          {section.content}
        </div>
      </motion.div>
    </div>
  )
}