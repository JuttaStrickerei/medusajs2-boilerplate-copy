// pages/terms-and-services.tsx
import { NextPage } from "next"
import Head from "next/head"
import { Layout } from "@modules/layout/templates"
import { Container } from "@modules/layout/components"

const TermsAndServices: NextPage = () => {
  return (
    <>
      <Head>
        <title>Terms and Services | Your Store Name</title>
        <meta name="description" content="Terms and Services for Your Store Name" />
      </Head>
      <div className="flex-1">
        <Container>
          <div className="max-w-4xl mx-auto py-12">
            <h1 className="text-2xl-semi text-gray-900 mb-8">
              Terms and Services
            </h1>
            <div className="text-gray-700 space-y-6">
              <section>
                <h2 className="text-xl-semi mb-4">1. Introduction</h2>
                <p>
                  Welcome to [Your Store Name]. By accessing and using this website, 
                  you accept and agree to be bound by the terms and provisions of this agreement.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl-semi mb-4">2. Use License</h2>
                <p>
                  Permission is granted to temporarily download one copy of the materials 
                  (information or software) on [Your Store Name]'s website for personal, 
                  non-commercial transitory viewing only.
                </p>
              </section>

              {/* Add more sections as needed */}
            </div>
          </div>
        </Container>
      </div>
    </>
  )
}

TermsAndServices.getLayout = (page) => {
  return <Layout>{page}</Layout>
}

export default TermsAndServices