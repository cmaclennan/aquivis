'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, Calendar, CheckCircle2, Droplets } from 'lucide-react'

export default function StyleGuidePage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Style Gallery</h1>
        <p className="text-sm text-muted-foreground">Design tokens and core components preview</p>
      </div>

      {/* Buttons */}
      <Card className="card-soft">
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
          <CardDescription>Primary actions and variants</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
          </div>
        </CardContent>
      </Card>

      {/* Inputs */}
      <Card className="card-soft">
        <CardHeader>
          <CardTitle>Inputs</CardTitle>
          <CardDescription>Form fields with labels and focus rings</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Sheraton Main Pool" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="volume">Volume (L)</Label>
            <Input id="volume" type="number" placeholder="50000" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Unit Type</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select unit type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main_pool">Main Pool</SelectItem>
                <SelectItem value="kids_pool">Kids Pool</SelectItem>
                <SelectItem value="main_spa">Main Spa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Today's Services</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">12</div>
            <p className="text-sm text-muted-foreground">Across all properties</p>
          </CardContent>
        </Card>

        <Card className="card-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Water Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">3</div>
            <p className="text-sm text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card className="card-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">28</div>
            <p className="text-sm text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Cards list */}
      <Card className="card-soft">
        <CardHeader>
          <CardTitle>Service Card</CardTitle>
          <CardDescription>Example of a service item layout</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Droplets className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">Full Service - Main Pool</div>
                <div className="text-sm text-muted-foreground">Sheraton • 09:30</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">View</Button>
              <Button>Start</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}







