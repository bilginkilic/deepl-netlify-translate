import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateWeddingForm } from "@/components/create-wedding-form";

export default function NewWeddingPage() {
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Create your wedding</CardTitle>
        <CardDescription>
          UK venue fields, GBP settings, and guest invites — all in one place.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CreateWeddingForm />
      </CardContent>
    </Card>
  );
}
