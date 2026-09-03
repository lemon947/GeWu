import { Routes, Route } from 'react-router'
import Layout from './components/Layout'
import Home from './pages/Home'
import Panorama from './pages/Panorama'
import CorpusSearch from './pages/CorpusSearch'
import ToolMarket from './pages/ToolMarket'
import About from './pages/About'
import DatasetDetail from './pages/DatasetDetail'
import DatasetEdit from './pages/DatasetEdit'
import DatasetAudit from './pages/DatasetAudit'
import CorpusUpload from './pages/CorpusUpload'
import Profile from './pages/Profile'
import DemandSquare from './pages/DemandSquare'
import DemandDetail from './pages/DemandDetail'
import DemandCreate from './pages/DemandCreate'
import DemandPosterMaker from './pages/DemandPosterMaker'
import DemandPostEditor from './pages/DemandPostEditor'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/panorama" element={<Panorama />} />
        <Route path="/search" element={<CorpusSearch pageType="search" />} />
        <Route path="/search/results" element={<ProtectedRoute><CorpusSearch pageType="results" /></ProtectedRoute>} />
        <Route path="/search/datasets/:id" element={<ProtectedRoute><DatasetDetail /></ProtectedRoute>} />
        <Route path="/search/datasets/:id/edit" element={<ProtectedRoute><DatasetEdit /></ProtectedRoute>} />
        <Route path="/search/datasets/:id/audit" element={<ProtectedRoute><DatasetAudit /></ProtectedRoute>} />
        <Route path="/upload" element={<CorpusUpload />} />
        <Route path="/demands" element={<DemandSquare />} />
        <Route path="/demands/new" element={<DemandCreate />} />
        <Route path="/demands/new/edit" element={<DemandPostEditor />} />
        <Route path="/demands/new/poster" element={<DemandPosterMaker />} />
        <Route path="/demands/:id" element={<DemandDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/tools" element={<ToolMarket />} />
        <Route path="/about" element={<About />} />
      </Route>
    </Routes>
  )
}
