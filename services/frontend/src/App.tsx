import { Hero } from './sections/Hero'
import { Features } from './sections/Features'
import { CTA } from './sections/CTA'
import { Footer } from './sections/Footer'
import { Layout } from 'antd'

const { Content } = Layout

function App() {
  return (
    <Layout style={{ background: 'transparent' }}>
      <Content>
        <Hero />
        <Features />
        <CTA />
      </Content>
      <Footer />
    </Layout>
  )
}

export default App
