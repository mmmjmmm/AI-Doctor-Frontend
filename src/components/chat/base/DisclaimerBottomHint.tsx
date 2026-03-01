export default function DisclaimerBottomHint({ text }: { text?: string }) {
  if (!text) return null;
  return <p className="text-[10px] text-gray-400 mt-2 ml-1">{text}</p>;
}
