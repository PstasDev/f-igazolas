'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SubFormField {
  name: string;
  type: 'text' | 'select' | 'textarea' | 'number';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
}

interface SubFormSchema {
  fields: SubFormField[];
}

export interface SubFormRendererProps {
  schema: SubFormSchema;
  data: Record<string, string | number>;
  onChange: (data: Record<string, string | number>) => void;
  className?: string;
}

export function SubFormRenderer({ schema, data, onChange, className }: SubFormRendererProps) {
  const handleFieldChange = (fieldName: string, value: string | number) => {
    onChange({
      ...data,
      [fieldName]: value
    });
  };

  const renderField = (field: SubFormField) => {
    const value = data[field.name] || '';

    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type={field.type}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleFieldChange(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
              required={field.required}
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={field.name}
              placeholder={field.placeholder}
              value={value as string}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              required={field.required}
              rows={3}
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select 
              value={value as string} 
              onValueChange={(val) => handleFieldChange(field.name, val)}
              required={field.required}
            >
              <SelectTrigger id={field.name}>
                <SelectValue placeholder={field.placeholder || 'Válassz...'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={className}>
      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
        <h4 className="font-semibold">További részletek</h4>
        <div className="space-y-4">
          {schema.fields.map((field) => renderField(field))}
        </div>
      </div>
    </div>
  );
}
