import { NextPage } from "next"

const Impressum: NextPage = () => {
  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "2rem auto",
        padding: "2rem",
        fontFamily: "Arial, sans-serif",
        lineHeight: "1.6",
        color: "#333",
      }}
    >
      <header style={{ marginBottom: "2rem", textAlign: "center" }}>
        <h1>Impressum</h1>
      </header>
      <p>Hello World</p>
    </div>
  )
}

export default Impressum
