import { useEffect, useState } from "react";
import { getTemplatesByCategory } from "@/db/api";
import type { Template } from "@/types";

interface TemplateRendererProps {
  category: string;
  name?: string;
  data?: Record<string, any>;
  fallback?: React.ReactNode;
  className?: string;
}

export default function TemplateRenderer({
  category,
  name,
  data = {},
  fallback,
  className = "",
}: TemplateRendererProps) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplate();
  }, [category, name]);

  async function loadTemplate() {
    try {
      setLoading(true);
      setError(null);
      const templates = await getTemplatesByCategory(category);
      
      let selectedTemplate: Template | null = null;
      if (name) {
        selectedTemplate = templates.find(t => t.name === name) || null;
      } else {
        selectedTemplate = templates[0] || null;
      }

      setTemplate(selectedTemplate);
    } catch (err) {
      console.error("Failed to load template:", err);
      setError("Failed to load template");
    } finally {
      setLoading(false);
    }
  }

  function renderTemplate(content: string, templateData: Record<string, any>): string {
    let rendered = content;
    
    // Replace template variables {{variable}}
    Object.keys(templateData).forEach(key => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      const value = templateData[key] !== undefined && templateData[key] !== null 
        ? String(templateData[key]) 
        : '';
      rendered = rendered.replace(regex, value);
    });

    return rendered;
  }

  if (loading) {
    return fallback || <div className="animate-pulse bg-muted rounded-lg h-32"></div>;
  }

  if (error || !template) {
    return fallback || <div className="text-muted-foreground text-center py-8">No template</div>;
  }

  const renderedContent = renderTemplate(template.content, data);

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
}
