import { Link } from "react-router-dom"

interface Props {
    to: string
}

const GoBackBtn = ({ to }: Props) => {
  return (
    <Link to={to}>{"<-"}</Link>
  )
}

export default GoBackBtn