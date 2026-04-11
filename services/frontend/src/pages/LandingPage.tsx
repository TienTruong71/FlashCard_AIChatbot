import { Layout } from 'antd'
import { Hero } from '../sections/Hero'
import { Features } from '../sections/Features'
import { CTA } from '../sections/CTA'
import { Footer } from '../sections/Footer'

const { Content } = Layout

export const LandingPage = () => {
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
