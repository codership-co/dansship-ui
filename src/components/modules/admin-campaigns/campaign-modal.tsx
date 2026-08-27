import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Resolver, useFieldArray, useForm, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@components/ui';
import {
  type Campaign,
  type CampaignKind,
  type CampaignQuestion,
  type CreateCampaignPayload,
  type PlanStatusFilter,
  type StructuredCampaignType,
} from '@core/api';

const EMPTY_OPTION = '__none__';

const createQuestionId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

const createQuestionSchema = (t: (key: string) => string) =>
  z.discriminatedUnion('type', [
    z.object({
      type: z.literal('text'),
      id: z.string(),
      prompt: z.string().min(1, { message: t('campaigns:validation.questionRequired') }),
      required: z.boolean(),
    }),
    z.object({
      type: z.literal('multiple_choice'),
      id: z.string(),
      prompt: z.string().min(1, { message: t('campaigns:validation.questionRequired') }),
      required: z.boolean(),
      allow_multiple: z.boolean(),
      options: z
        .array(
          z.object({
            id: z.string(),
            label: z.string().min(1, { message: t('campaigns:validation.optionRequired') }),
          }),
        )
        .min(2, { message: t('campaigns:validation.minOptions') }),
    }),
    z.object({
      type: z.literal('scale'),
      id: z.string(),
      prompt: z.string().min(1, { message: t('campaigns:validation.questionRequired') }),
      required: z.boolean(),
      min: z.coerce.number(),
      max: z.coerce.number(),
      min_label: z.string().optional(),
      max_label: z.string().optional(),
    }),
  ]);

const createCampaignSchema = (t: (key: string) => string) =>
  z
    .object({
      title: z.string().min(1, { message: t('campaigns:validation.titleRequired') }),
      description: z.string().optional(),
      kind: z.enum(['free', 'structured']),
      structured_type: z.string().optional(),
      plan_status: z.enum(['any', 'active', 'inactive']),
      instructor_id: z.string(),
      class_definition_id: z.string(),
      valid_from: z.string().optional(),
      valid_until: z.string().optional(),
      questions: z.array(z.unknown()),
    })
    .superRefine((values, ctx) => {
      if (values.kind === 'structured') {
        if (!values.structured_type) {
          ctx.addIssue({
            code: 'custom',
            message: t('campaigns:validation.structuredTypeRequired'),
            path: ['structured_type'],
          });
        }

        return;
      }

      if (values.questions.length === 0) {
        ctx.addIssue({
          code: 'custom',
          message: t('campaigns:validation.questionsRequired'),
          path: ['questions'],
        });

        return;
      }

      const questionSchema = createQuestionSchema(t);

      values.questions.forEach((question, index) => {
        const parsed = questionSchema.safeParse(question);

        if (!parsed.success) {
          parsed.error.issues.forEach(issue => {
            ctx.addIssue({
              code: 'custom',
              message: issue.message,
              path: ['questions', index, ...issue.path],
            });
          });

          return;
        }

        if (parsed.data.type === 'scale' && parsed.data.max <= parsed.data.min) {
          ctx.addIssue({
            code: 'custom',
            message: t('campaigns:validation.scaleRange'),
            path: ['questions', index, 'max'],
          });
        }
      });
    });

type CampaignQuestionForm = z.infer<ReturnType<typeof createQuestionSchema>>;
type CampaignFormValues = Omit<z.infer<ReturnType<typeof createCampaignSchema>>, 'questions'> & {
  questions: Array<CampaignQuestionForm>;
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className='text-sm text-alert-500'>{message}</p>;
}

interface InstructorOption {
  id: string;
  label: string;
}

interface ClassOption {
  id: string;
  name: string;
}

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateCampaignPayload) => Promise<boolean>;
  initialData?: Campaign | null;
  isLoading?: boolean;
  structuredTypes: Array<StructuredCampaignType>;
  instructors: Array<InstructorOption>;
  classes: Array<ClassOption>;
}

function toDatetimeLocal(value?: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (part: number) => String(part).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocal(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function emptyQuestion(type: CampaignQuestion['type']): CampaignFormValues['questions'][number] {
  const id = createQuestionId();

  if (type === 'multiple_choice') {
    return {
      type,
      id,
      prompt: '',
      required: true,
      allow_multiple: false,
      options: [
        { id: createQuestionId(), label: '' },
        { id: createQuestionId(), label: '' },
      ],
    };
  }

  if (type === 'scale') {
    return { type, id, prompt: '', required: true, min: 1, max: 5, min_label: '', max_label: '' };
  }

  return { type: 'text', id, prompt: '', required: true };
}

function questionsFromCampaign(questions: Array<CampaignQuestion>): CampaignFormValues['questions'] {
  return questions.map(question => {
    if (question.type === 'multiple_choice') {
      return {
        type: 'multiple_choice' as const,
        id: question.id,
        prompt: question.prompt,
        required: question.required,
        allow_multiple: question.allow_multiple,
        options: question.options,
      };
    }

    if (question.type === 'scale') {
      return {
        type: 'scale' as const,
        id: question.id,
        prompt: question.prompt,
        required: question.required,
        min: question.min,
        max: question.max,
        min_label: question.min_label ?? '',
        max_label: question.max_label ?? '',
      };
    }

    return {
      type: 'text' as const,
      id: question.id,
      prompt: question.prompt,
      required: question.required,
    };
  });
}

export function CampaignModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
  structuredTypes,
  instructors,
  classes,
}: CampaignModalProps) {
  const { t } = useTranslation();
  const schema = createCampaignSchema(t);
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(schema) as Resolver<CampaignFormValues>,
    defaultValues: {
      title: '',
      description: '',
      kind: 'free',
      structured_type: '',
      plan_status: 'any',
      instructor_id: EMPTY_OPTION,
      class_definition_id: EMPTY_OPTION,
      valid_from: '',
      valid_until: '',
      questions: [emptyQuestion('text')],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'questions' });
  const kind = form.watch('kind');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (initialData) {
      form.reset({
        title: initialData.title,
        description: initialData.description ?? '',
        kind: initialData.kind,
        structured_type: initialData.structured_type ?? '',
        plan_status: initialData.audience.plan_status,
        instructor_id: initialData.audience.instructor_id ?? EMPTY_OPTION,
        class_definition_id: initialData.audience.class_definition_id ?? EMPTY_OPTION,
        valid_from: toDatetimeLocal(initialData.valid_from),
        valid_until: toDatetimeLocal(initialData.valid_until),
        questions: questionsFromCampaign(initialData.questions),
      });

      return;
    }

    form.reset({
      title: '',
      description: '',
      kind: 'free',
      structured_type: '',
      plan_status: 'any',
      instructor_id: EMPTY_OPTION,
      class_definition_id: EMPTY_OPTION,
      valid_from: '',
      valid_until: '',
      questions: [emptyQuestion('text')],
    });
  }, [form, initialData, isOpen]);

  const handleSubmit = form.handleSubmit(async values => {
    const payload: CreateCampaignPayload = {
      title: values.title,
      description: values.description || null,
      kind: values.kind,
      audience: {
        plan_status: values.plan_status as PlanStatusFilter,
        instructor_id: values.instructor_id === EMPTY_OPTION ? null : values.instructor_id,
        class_definition_id: values.class_definition_id === EMPTY_OPTION ? null : values.class_definition_id,
      },
      valid_from: fromDatetimeLocal(values.valid_from),
      valid_until: fromDatetimeLocal(values.valid_until),
    };

    if (values.kind === 'structured') {
      payload.structured_type = values.structured_type;
      payload.questions = [];
    } else {
      payload.questions = values.questions as Array<CampaignQuestion>;
    }

    const ok = await onSubmit(payload);

    if (ok) {
      onClose();
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className='max-h-[90dvh] overflow-y-auto max-w-2xl'>
        <DialogHeader>
          <DialogTitle>
            {initialData ? t('campaigns:admin.modal.editTitle') : t('campaigns:admin.modal.createTitle')}
          </DialogTitle>
        </DialogHeader>
        <form className='space-y-4' onSubmit={handleSubmit}>
          <div className='space-y-2'>
            <Label htmlFor='campaign-title'>{t('campaigns:admin.modal.title')}</Label>
            <Input id='campaign-title' {...form.register('title')} />
            <FieldError message={form.formState.errors.title?.message} />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='campaign-description'>{t('campaigns:admin.modal.description')}</Label>
            <Textarea id='campaign-description' {...form.register('description')} />
          </div>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>{t('campaigns:admin.modal.kind')}</Label>
              <Select
                disabled={Boolean(initialData)}
                value={kind}
                onValueChange={value => {
                  const nextKind = value as CampaignKind;
                  form.setValue('kind', nextKind);
                  form.clearErrors('questions');

                  if (nextKind === 'structured') {
                    form.setValue('questions', []);

                    return;
                  }

                  if (form.getValues('questions').length === 0) {
                    form.setValue('questions', [emptyQuestion('text')]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='free'>{t('campaigns:admin.kind.free')}</SelectItem>
                  <SelectItem value='structured'>{t('campaigns:admin.kind.structured')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {kind === 'structured' ? (
              <div className='space-y-2'>
                <Label>{t('campaigns:admin.modal.structuredType')}</Label>
                {structuredTypes.length === 0 ? (
                  <p className='text-sm text-gray-500'>{t('campaigns:admin.modal.noStructuredTypes')}</p>
                ) : (
                  <Select
                    disabled={Boolean(initialData)}
                    value={form.watch('structured_type') || undefined}
                    onValueChange={value => form.setValue('structured_type', value, { shouldValidate: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('campaigns:admin.modal.structuredType')} />
                    </SelectTrigger>
                    <SelectContent>
                      {structuredTypes.map(type => (
                        <SelectItem key={type.type_key} value={type.type_key}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <FieldError message={form.formState.errors.structured_type?.message} />
              </div>
            ) : null}
          </div>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>{t('campaigns:admin.modal.planStatus')}</Label>
              <Select
                value={form.watch('plan_status')}
                onValueChange={value => form.setValue('plan_status', value as PlanStatusFilter)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='any'>{t('campaigns:admin.planStatus.any')}</SelectItem>
                  <SelectItem value='active'>{t('campaigns:admin.planStatus.active')}</SelectItem>
                  <SelectItem value='inactive'>{t('campaigns:admin.planStatus.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>{t('campaigns:admin.modal.instructor')}</Label>
              <Select
                value={form.watch('instructor_id')}
                onValueChange={value => form.setValue('instructor_id', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_OPTION}>{t('campaigns:admin.modal.none')}</SelectItem>
                  {instructors.map(instructor => (
                    <SelectItem key={instructor.id} value={instructor.id}>
                      {instructor.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>{t('campaigns:admin.modal.classDefinition')}</Label>
              <Select
                value={form.watch('class_definition_id')}
                onValueChange={value => form.setValue('class_definition_id', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_OPTION}>{t('campaigns:admin.modal.none')}</SelectItem>
                  {classes.map(classDefinition => (
                    <SelectItem key={classDefinition.id} value={classDefinition.id}>
                      {classDefinition.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='valid-from'>{t('campaigns:admin.modal.validFrom')}</Label>
              <Input id='valid-from' type='datetime-local' {...form.register('valid_from')} />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='valid-until'>{t('campaigns:admin.modal.validUntil')}</Label>
              <Input id='valid-until' type='datetime-local' {...form.register('valid_until')} />
            </div>
          </div>
          {kind === 'free' ? (
            <div className='space-y-3'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <Label>{t('campaigns:admin.modal.questions')}</Label>
                <div className='flex flex-wrap gap-2'>
                  <Button type='button' variant='outline' size='sm' onClick={() => append(emptyQuestion('text'))}>
                    {t('campaigns:admin.modal.questionTypes.text')}
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => append(emptyQuestion('multiple_choice'))}
                  >
                    {t('campaigns:admin.modal.questionTypes.multiple_choice')}
                  </Button>
                  <Button type='button' variant='outline' size='sm' onClick={() => append(emptyQuestion('scale'))}>
                    {t('campaigns:admin.modal.questionTypes.scale')}
                  </Button>
                </div>
              </div>
              <FieldError
                message={
                  typeof form.formState.errors.questions?.message === 'string'
                    ? form.formState.errors.questions.message
                    : form.formState.errors.questions?.root?.message
                }
              />
              {fields.map((field, index) => {
                const questionType = form.watch(`questions.${index}.type`);

                return (
                  <div key={field.id} className='rounded-lg border border-gray-200 p-4 space-y-3'>
                    <div className='flex justify-between gap-2'>
                      <p className='text-sm font-medium'>{t(`campaigns:admin.modal.questionTypes.${questionType}`)}</p>
                      <Button type='button' variant='outline' size='sm' onClick={() => remove(index)}>
                        {t('common:remove')}
                      </Button>
                    </div>
                    <Input
                      placeholder={t('campaigns:admin.modal.questionPrompt')}
                      {...form.register(`questions.${index}.prompt`)}
                    />
                    <FieldError
                      message={
                        (form.formState.errors.questions as Array<{ prompt?: { message?: string } }> | undefined)?.[
                          index
                        ]?.prompt?.message
                      }
                    />
                    <label className='flex items-center gap-2 text-sm'>
                      <Checkbox
                        checked={form.watch(`questions.${index}.required`)}
                        onCheckedChange={checked => form.setValue(`questions.${index}.required`, Boolean(checked))}
                      />
                      {t('campaigns:admin.modal.required')}
                    </label>
                    {questionType === 'multiple_choice' ? <MultipleChoiceEditor form={form} index={index} /> : null}
                    {questionType === 'scale' ? (
                      <div className='grid gap-3 sm:grid-cols-2'>
                        <Input type='number' {...form.register(`questions.${index}.min`, { valueAsNumber: true })} />
                        <Input type='number' {...form.register(`questions.${index}.max`, { valueAsNumber: true })} />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
          <div className='flex justify-end gap-2'>
            <Button type='button' variant='outline' onClick={onClose}>
              {t('common:cancel')}
            </Button>
            <Button type='submit' disabled={isLoading}>
              {t('common:save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MultipleChoiceEditor({ form, index }: { form: UseFormReturn<CampaignFormValues>; index: number }) {
  const { t } = useTranslation();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `questions.${index}.options`,
  });

  return (
    <div className='space-y-2'>
      <label className='flex items-center gap-2 text-sm'>
        <Checkbox
          checked={form.watch(`questions.${index}.allow_multiple`)}
          onCheckedChange={checked => form.setValue(`questions.${index}.allow_multiple`, Boolean(checked))}
        />
        {t('campaigns:admin.modal.allowMultiple')}
      </label>
      {fields.map((option, optionIndex) => (
        <div key={option.id} className='flex gap-2'>
          <Input {...form.register(`questions.${index}.options.${optionIndex}.label`)} />
          <Button type='button' variant='outline' size='sm' onClick={() => remove(optionIndex)}>
            {t('common:remove')}
          </Button>
        </div>
      ))}
      <Button type='button' variant='outline' size='sm' onClick={() => append({ id: createQuestionId(), label: '' })}>
        {t('campaigns:admin.modal.addOption')}
      </Button>
    </div>
  );
}
