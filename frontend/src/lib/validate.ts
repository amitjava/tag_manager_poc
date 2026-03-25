export function validateCreate(form: {
  name: string
  tag_name: string
  tag_code: string
}): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!form.name.trim()) errors.name = 'Advertiser name is required'
  if (!form.tag_name.trim()) errors.tag_name = 'Tag name is required'
  if (!form.tag_code.trim()) errors.tag_code = 'Tag code is required'
  return errors
}

export function validateUpdate(form: {
  tag_name: string
  tag_code: string
}): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!form.tag_name.trim()) errors.tag_name = 'Tag name is required'
  if (!form.tag_code.trim()) errors.tag_code = 'Tag code is required'
  return errors
}

export function hasErrors(errors: Record<string, string>): boolean {
  return Object.keys(errors).length > 0
}
