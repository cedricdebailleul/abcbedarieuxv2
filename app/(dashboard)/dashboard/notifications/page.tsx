import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconBell, IconCheck } from "@tabler/icons-react";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">
          Gérez vos notifications et préférences de communication.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Notifications récentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconBell className="h-5 w-5" />
              Notifications récentes
            </CardTitle>
            <CardDescription>
              Vos dernières notifications et mises à jour.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <IconCheck className="h-4 w-4 text-green-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Bienvenue sur ABC Bédarieux !
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Votre compte a été créé avec succès.
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  Maintenant
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Préférences de notification */}
        <Card>
          <CardHeader>
            <CardTitle>Préférences de notification</CardTitle>
            <CardDescription>
              Configurez comment vous souhaitez recevoir les notifications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notifications par email</p>
                  <p className="text-sm text-muted-foreground">
                    Recevoir les notifications importantes par email
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">Activé</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Newsletter</p>
                  <p className="text-sm text-muted-foreground">
                    Recevoir la newsletter hebdomadaire d&apos;ABC Bédarieux
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">Configuré</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
