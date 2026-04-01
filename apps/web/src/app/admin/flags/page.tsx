import FlagQueue from "../../../components/moderation/FlagQueue"

export default function FlagsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-primary mb-6">
        Flag Review Queue
      </h2>
      <FlagQueue />
    </div>
  )
}
