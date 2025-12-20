export default function Notification({ message, rule }) {
  return (
    <div className="notification">
      <p>{message}</p>
      {rule && <small>Норма: {rule}</small>}
    </div>
  )
}
