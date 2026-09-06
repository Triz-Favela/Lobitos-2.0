import "./MainButton.css"

const MainButton = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => {
  return (
    <button className="main-button" onClick={onClick}>
      {children}
    </button>
  )
}

export default MainButton