type AuthTrustMicrocopyProps = {
  text: string;
};

export function AuthTrustMicrocopy({ text }: AuthTrustMicrocopyProps) {
  return <p className="text-center text-xs text-night-300">{text}</p>;
}
