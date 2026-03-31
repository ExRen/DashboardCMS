import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { X, Pencil, Check, AlertCircle } from "lucide-react"

/**
 * BulkEditModal - Edit multiple items at once
 * @param {Object} props
 * @param {Array} props.selectedItems - Array of selected items
 * @param {Array} props.editableFields - Array of { key, label, type } objects
 * @param {Function} props.onSave - Callback with updated field values
 * @param {Function} props.onClose - Close modal callback
 */
export function BulkEditModal({
    selectedItems = [],
    editableFields = [],
    options = {},
    onSave,
    onClose
}) {
    const [fieldValues, setFieldValues] = useState({})
    const [saving, setSaving] = useState(false)

    // Handle field change
    function handleFieldChange(key, value) {
        setFieldValues(prev => ({
            ...prev,
            [key]: value
        }))
    }

    // Handle save
    async function handleSave() {
        setSaving(true)
        try {
            await onSave(fieldValues)
        } finally {
            setSaving(false)
        }
    }

    // Check if any field has value
    const hasChanges = Object.values(fieldValues).some(v => v !== undefined && v !== "")

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-lg mx-4">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Pencil className="h-5 w-5" />
                        Bulk Edit ({selectedItems.length} item)
                    </CardTitle>
                    <button onClick={onClose}>
                        <X className="h-5 w-5" />
                    </button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Info */}
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 text-blue-500 text-sm">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>Hanya field yang diisi yang akan diubah. Field kosong akan diabaikan.</span>
                    </div>

                    {/* Editable Fields */}
                    {editableFields.map(field => (
                        <div key={field.key}>
                            <label className="text-sm font-medium">{field.label}</label>
                            {field.type === "select" ? (
                                <select
                                    value={fieldValues[field.key] || ""}
                                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                    className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                                >
                                    <option value="">-- Tidak diubah --</option>
                                    {(options[field.key] || []).map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type={field.type || "text"}
                                    value={fieldValues[field.key] || ""}
                                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                    placeholder={`Biarkan kosong untuk tidak mengubah`}
                                    className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                                />
                            )}
                        </div>
                    ))}

                    {/* Preview */}
                    {hasChanges && (
                        <div className="p-3 rounded-lg bg-muted/50 border">
                            <div className="text-sm font-medium mb-2">Perubahan yang akan diterapkan:</div>
                            <div className="space-y-1">
                                {Object.entries(fieldValues).filter(([_, v]) => v).map(([key, value]) => (
                                    <div key={key} className="flex items-center gap-2 text-sm">
                                        <Check className="h-3 w-3 text-green-500" />
                                        <span className="text-muted-foreground">{key}:</span>
                                        <span className="font-medium">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" onClick={onClose} className="flex-1">
                            Batal
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!hasChanges || saving}
                            className="flex-1"
                        >
                            {saving ? "Menyimpan..." : `Terapkan ke ${selectedItems.length} item`}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default BulkEditModal
