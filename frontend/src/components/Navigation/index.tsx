import { create } from 'zustand'

type View = 'landing' | 'projects' | 'project' | 'docs' | 'docs-section' | 'features' | 'providers' | 'roadmap' | 'privacy' | 'terms' | 'constructs' | 'oauth-callback' | 'onboarding'

interface NavigationState {
  currentView: View
  currentProjectId: string | null
  currentDocSection: string | null
  navigate: (view: View, params?: { projectId?: string; docSection?: string }) => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentView: 'landing',
  currentProjectId: null,
  currentDocSection: null,
  navigate: (view, params) => set({
    currentView: view,
    currentProjectId: params?.projectId || null,
    currentDocSection: params?.docSection || null
  })
}))

export const useNavigate = () => {
  const { navigate } = useNavigationStore()
  
  return (view: string, params?: any) => {
    if (view.startsWith('docs/')) {
      navigate('docs-section', { docSection: view.replace('docs/', '') })
    } else if (view === 'project' && params?.id) {
      navigate('project', { projectId: params.id })
    } else {
      navigate(view as View, params)
    }
  }
}