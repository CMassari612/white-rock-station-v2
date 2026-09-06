import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Switch } from '../ui/switch';
import { api, Unit } from '../../lib/api';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface UnitsManagerProps {
  authToken: string;
}

export function UnitsManager({ authToken }: UnitsManagerProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    unitType: 'small_cabin' as Unit['unitType'],
    category: undefined as Unit['category'],
    active: true,
    notes: '',
  });

  useEffect(() => {
    loadUnits();
  }, [authToken]);

  const loadUnits = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.admin.getUnits(authToken);
      setUnits(response.units);
    } catch (error: any) {
      console.error('Failed to load units:', error);
      setError(error.message || 'Failed to load units');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (unit?: Unit) => {
    if (unit) {
      setEditingUnit(unit);
      setFormData({
        name: unit.name,
        unitType: unit.unitType,
        category: unit.category,
        active: unit.active,
        notes: unit.notes || '',
      });
    } else {
      setEditingUnit(null);
      setFormData({
        name: '',
        unitType: 'small_cabin',
        category: undefined,
        active: true,
        notes: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingUnit(null);
    setFormData({
      name: '',
      unitType: 'small_cabin',
      category: undefined,
      active: true,
      notes: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (editingUnit) {
        // Update existing unit
        await api.admin.updateUnit(editingUnit.id, {
          name: formData.name,
          unitType: formData.unitType,
          category: formData.category,
          active: formData.active,
          notes: formData.notes || undefined,
        }, authToken);
        setSuccess('Unit updated successfully');
      } else {
        // Create new unit
        await api.admin.createUnit({
          name: formData.name,
          unitType: formData.unitType,
          category: formData.category,
          active: formData.active,
          notes: formData.notes || undefined,
        }, authToken);
        setSuccess('Unit created successfully');
      }
      
      await loadUnits();
      handleCloseDialog();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to save unit');
    }
  };

  const handleToggleActive = async (unit: Unit) => {
    try {
      await api.admin.updateUnit(unit.id, { active: !unit.active }, authToken);
      await loadUnits();
    } catch (error: any) {
      setError(error.message || 'Failed to update unit');
    }
  };

  const handleDelete = async (unit: Unit) => {
    if (!confirm(`Are you sure you want to delete "${unit.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.admin.deleteUnit(unit.id, authToken);
      await loadUnits();
      setSuccess('Unit deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to delete unit');
    }
  };

  const getCategoryFromUnitType = (unitType: Unit['unitType']): Unit['category'] => {
    if (unitType === 'small_cabin' || unitType === 'large_cabin') return 'cabin';
    if (unitType === 'campsite') return 'campsite';
    return 'marina';
  };

  const unitTypeLabel: Record<Unit['unitType'], string> = {
    small_cabin: 'Small Cabin',
    large_cabin: 'Large Cabin',
    campsite: 'Campsite',
    marina_slip: 'Marina Slip',
  };

  const categoryLabel: Record<NonNullable<Unit['category']>, string> = {
    cabin: 'Cabin',
    campsite: 'Campsite',
    marina: 'Marina',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Units Management</CardTitle>
            <CardDescription>Manage your rental units (cabins, campsites, marina slips)</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Unit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingUnit ? 'Edit Unit' : 'Add New Unit'}</DialogTitle>
                <DialogDescription>
                  {editingUnit ? 'Update unit information' : 'Create a new rental unit'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g. Cabin 1, Site 402"
                  />
                </div>

                <div>
                  <Label htmlFor="unitType">Unit Type *</Label>
                  <Select
                    value={formData.unitType}
                    onValueChange={(value) => {
                      const unitType = value as Unit['unitType'];
                      setFormData({
                        ...formData,
                        unitType,
                        category: getCategoryFromUnitType(unitType),
                      });
                    }}
                  >
                    <SelectTrigger id="unitType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small_cabin">Small Cabin</SelectItem>
                      <SelectItem value="large_cabin">Large Cabin</SelectItem>
                      <SelectItem value="campsite">Campsite</SelectItem>
                      <SelectItem value="marina_slip">Marina Slip</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Category (Optional)</Label>
                  <Select
                    value={formData.category || ''}
                    onValueChange={(value) => setFormData({ ...formData, category: value as Unit['category'] || undefined })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Auto-detect" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Auto-detect</SelectItem>
                      <SelectItem value="cabin">Cabin</SelectItem>
                      <SelectItem value="campsite">Campsite</SelectItem>
                      <SelectItem value="marina">Marina</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                  <Label htmlFor="active">Active (available for booking)</Label>
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Any notes about this unit..."
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingUnit ? 'Update' : 'Create'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <p>Loading units...</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Unit Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No units found. Add your first unit to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  units.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell className="font-medium">{unit.name}</TableCell>
                      <TableCell>{unitTypeLabel[unit.unitType]}</TableCell>
                      <TableCell>{unit.category ? categoryLabel[unit.category] : '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={unit.active}
                            onCheckedChange={() => handleToggleActive(unit)}
                          />
                          <span className={unit.active ? 'text-green-600' : 'text-gray-400'}>
                            {unit.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {unit.notes || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(unit)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(unit)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


