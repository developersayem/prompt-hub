import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const DashboardHeader = ({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
}) => {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {icon && icon}
              {title}
            </CardTitle>
            <CardTitle></CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};

export default DashboardHeader;
