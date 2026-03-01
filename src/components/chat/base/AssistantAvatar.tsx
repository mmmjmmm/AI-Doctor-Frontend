import Icon from "@/components/Icon";

export default function AssistantAvatar() {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
        <Icon name="doctor" />
      </div>
      <span className="text-[14px] text-gray-500 font-medium">AI医生</span>
    </div>
  );
}
