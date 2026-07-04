import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { ConfirmDialog } from '@components/modals';
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import {
  AdminFigure,
  FigureAdminCreatePayload,
  FigureAdminStatusFilter,
  FigureAdminUpdatePayload,
  PaymentProofContentTypesList,
} from '@core/api';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';
import { useAdminFigures } from '@hooks';

type FigureFormState = {
  name: string;
  description: string;
  difficulty: 'basic' | 'intermediate' | 'intermediate-advance' | 'advance';
  type: 'spins' | 'climbs' | 'inverts' | 'flexibility' | 'strength';
  ipsf_code: string;
  aliases: string;
  prerequisites_ids: Array<number>;
};

const EMPTY_FORM: FigureFormState = {
  name: '',
  description: '',
  difficulty: 'basic',
  type: 'spins',
  ipsf_code: '',
  aliases: '',
  prerequisites_ids: [],
};

function AdminFiguresPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<FigureAdminStatusFilter>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingFigure, setEditingFigure] = useState<AdminFigure | null>(null);
  const [figureToDelete, setFigureToDelete] = useState<AdminFigure | null>(null);
  const [formState, setFormState] = useState<FigureFormState>(EMPTY_FORM);
  const [prerequisitesDirty, setPrerequisitesDirty] = useState(false);
  const [prerequisiteSearch, setPrerequisiteSearch] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const activeTab = useMemo(() => {
    return searchParams.get('tab') === 'bulk' ? 'bulk' : 'crud';
  }, [searchParams]);

  const {
    figures,
    total,
    isLoading,
    createFigure,
    updateFigure,
    approveFigure,
    deleteFigure,
    importFiguresCsv,
    uploadFigureImage,
    removeFigureImage,
    importResult,
    isCreating,
    isUpdating,
    isApproving,
    isDeleting,
    isImporting,
    isUploadingImage,
    isRemovingImage,
  } = useAdminFigures({
    status: statusFilter,
    sortBy: 'updated_at',
    order: 'desc',
    limit: 100,
    offset: 0,
  });

  const isSubmitting = isCreating || isUpdating || isApproving || isDeleting;

  const prerequisiteOptions = useMemo(() => {
    return figures.filter(figure => figure.id !== editingFigure?.id);
  }, [figures, editingFigure?.id]);

  const filteredPrerequisiteOptions = useMemo(() => {
    const searchTerm = prerequisiteSearch.trim().toLowerCase();

    if (!searchTerm) {
      return prerequisiteOptions;
    }

    return prerequisiteOptions.filter(figure => {
      const nameMatch = figure.name.toLowerCase().includes(searchTerm);
      const ipsfMatch = (figure.ipsf_code ?? '').toLowerCase().includes(searchTerm);

      return nameMatch || ipsfMatch;
    });
  }, [prerequisiteOptions, prerequisiteSearch]);

  const resetForm = () => {
    setEditingFigure(null);
    setFormState(EMPTY_FORM);
    setPrerequisitesDirty(false);
    setPrerequisiteSearch('');
  };

  const openCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (figure: AdminFigure) => {
    setEditingFigure(figure);
    setFormState({
      name: figure.name,
      description: figure.description ?? '',
      difficulty: figure.difficulty,
      type: figure.type,
      ipsf_code: figure.ipsf_code ?? '',
      aliases: figure.aliases ?? '',
      prerequisites_ids: figure.prerequisites_ids ?? [],
    });
    setPrerequisitesDirty(false);
    setPrerequisiteSearch('');
    setFormOpen(true);
  };

  const togglePrerequisite = (figureId: number, checked: boolean) => {
    setPrerequisitesDirty(true);
    setFormState(prev => {
      const next = new Set(prev.prerequisites_ids);

      if (checked) {
        next.add(figureId);
      } else {
        next.delete(figureId);
      }

      return {
        ...prev,
        prerequisites_ids: [...next],
      };
    });
  };

  const handleSubmit = async () => {
    const basePayload = {
      name: formState.name.trim(),
      description: formState.description.trim() || null,
      difficulty: formState.difficulty,
      type: formState.type,
      ipsf_code: formState.ipsf_code.trim() || null,
      aliases: formState.aliases.trim(),
    };

    if (editingFigure) {
      const payload: FigureAdminUpdatePayload = {
        ...basePayload,
        ...(prerequisitesDirty ? { prerequisites_ids: formState.prerequisites_ids } : {}),
      };
      await updateFigure(editingFigure.id, payload);
    } else {
      const payload: FigureAdminCreatePayload = {
        ...basePayload,
        prerequisites_ids: formState.prerequisites_ids,
        status: 'draft',
      };
      await createFigure(payload);
    }

    setFormOpen(false);
    resetForm();
  };

  const handleApprove = async (figure: AdminFigure) => {
    await approveFigure(figure.id);
  };

  const handleDelete = (figure: AdminFigure) => {
    setFigureToDelete(figure);
  };

  const handleConfirmDelete = async () => {
    if (!figureToDelete) {
      return;
    }

    await deleteFigure(figureToDelete.id);
    setFigureToDelete(null);
  };

  const handleImport = async () => {
    if (!csvFile) {
      return;
    }

    await importFiguresCsv(csvFile);
  };

  const handleImageUpload = async (file: File) => {
    if (!editingFigure) {
      return;
    }

    const updated = await uploadFigureImage(editingFigure.id, file);

    if (updated) {
      setEditingFigure(updated);
    }
  };

  const handleImageRemove = async (fileKey: string) => {
    if (!editingFigure) {
      return;
    }

    const updated = await removeFigureImage(editingFigure.id, fileKey);

    if (updated) {
      setEditingFigure(updated);
    }
  };

  return (
    <div className='mx-auto max-w-7xl px-4 py-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>
          {t('figures.admin.title', { defaultValue: 'Figure Management' })}
        </h1>
        <p className='mt-2 text-gray-500'>
          {t('figures.admin.subtitle', {
            defaultValue: 'Import draft figures in bulk or manage each figure before approval.',
          })}
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={value => {
          setSearchParams(previous => {
            const next = new URLSearchParams(previous);

            if (value === 'bulk') {
              next.set('tab', 'bulk');
            } else {
              next.delete('tab');
            }

            return next;
          });
        }}
      >
        <TabsList className='mb-4 border border-gray-200 bg-white shadow-sm'>
          <TabsTrigger value='crud'>{t('figures.admin.tabs.crud', { defaultValue: 'CRUD' })}</TabsTrigger>
          <TabsTrigger value='bulk'>{t('figures.admin.tabs.bulk', { defaultValue: 'Bulk Import' })}</TabsTrigger>
        </TabsList>

        <TabsContent value='crud' className='rounded-lg border border-gray-100 bg-white p-6 shadow-sm'>
          <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
            <div>
              <p className='mb-2 text-sm text-gray-600'>
                {t('figures.admin.filters.status', { defaultValue: 'Status' })}
              </p>
              <Select value={statusFilter} onValueChange={value => setStatusFilter(value as FigureAdminStatusFilter)}>
                <SelectTrigger className='w-55'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>{t('common.all', { defaultValue: 'All' })}</SelectItem>
                  <SelectItem value='draft'>{t('figures.admin.status.draft', { defaultValue: 'Draft' })}</SelectItem>
                  <SelectItem value='approved'>
                    {t('figures.admin.status.approved', { defaultValue: 'Approved' })}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={openCreate}>{t('figures.admin.actions.create', { defaultValue: 'New Figure' })}</Button>
          </div>

          <div className='mb-3 text-sm text-gray-600'>
            {t('figures.admin.total', { defaultValue: 'Total: {{count}}', count: total })}
          </div>

          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('figures.admin.table.name', { defaultValue: 'Name' })}</TableHead>
                  <TableHead>{t('figures.admin.table.status', { defaultValue: 'Status' })}</TableHead>
                  <TableHead>{t('figures.admin.table.difficulty', { defaultValue: 'Difficulty' })}</TableHead>
                  <TableHead>{t('figures.admin.table.type', { defaultValue: 'Type' })}</TableHead>
                  <TableHead>{t('figures.admin.table.ipsf', { defaultValue: 'IPSF' })}</TableHead>
                  <TableHead className='text-right'>{t('common.actions', { defaultValue: 'Actions' })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className='py-8 text-center text-gray-500'>
                      {t('common.loading', { defaultValue: 'Loading...' })}
                    </TableCell>
                  </TableRow>
                ) : figures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className='py-8 text-center text-gray-500'>
                      {t('common.noData', { defaultValue: 'No data available.' })}
                    </TableCell>
                  </TableRow>
                ) : (
                  figures.map(figure => (
                    <TableRow key={figure.id}>
                      <TableCell className='font-medium'>{figure.name}</TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            figure.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {figure.status === 'approved'
                            ? t('figures.admin.status.approved', { defaultValue: 'Approved' })
                            : t('figures.admin.status.draft', { defaultValue: 'Draft' })}
                        </span>
                      </TableCell>
                      <TableCell>{figure.difficulty}</TableCell>
                      <TableCell>{figure.type}</TableCell>
                      <TableCell>{figure.ipsf_code ?? '-'}</TableCell>
                      <TableCell>
                        <div className='flex justify-end gap-2'>
                          <Button variant='outline' size='sm' onClick={() => openEdit(figure)}>
                            {t('common.edit', { defaultValue: 'Edit' })}
                          </Button>
                          {figure.status === 'draft' ? (
                            <Button
                              size='sm'
                              variant='secondary'
                              onClick={() => handleApprove(figure)}
                              disabled={isApproving}
                            >
                              {t('figures.admin.actions.approve', { defaultValue: 'Approve' })}
                            </Button>
                          ) : null}
                          <Button
                            size='sm'
                            variant='destructive'
                            onClick={() => handleDelete(figure)}
                            disabled={isDeleting}
                          >
                            {t('common.delete', { defaultValue: 'Delete' })}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value='bulk' className='rounded-lg border border-gray-100 bg-white p-6 shadow-sm'>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='figures-csv-upload'>
                {t('figures.admin.bulk.fileLabel', { defaultValue: 'CSV file' })}
              </Label>
              <Input
                id='figures-csv-upload'
                type='file'
                accept='.csv,text/csv'
                onChange={event => {
                  setCsvFile(event.target.files?.[0] ?? null);
                }}
              />
            </div>

            <Button onClick={handleImport} disabled={!csvFile || isImporting}>
              {isImporting
                ? t('figures.admin.bulk.importing', { defaultValue: 'Importing...' })
                : t('figures.admin.bulk.importAction', { defaultValue: 'Import CSV' })}
            </Button>

            {importResult ? (
              <div className='space-y-3'>
                <div className='rounded-md border bg-gray-50 p-3 text-sm'>
                  <p>
                    {t('figures.admin.bulk.summary', {
                      defaultValue: 'Rows: {{rows}} | Created: {{created}} | Skipped: {{skipped}}',
                      rows: importResult.total_rows,
                      created: importResult.created,
                      skipped: importResult.skipped,
                    })}
                  </p>
                </div>

                <div className='rounded-md border'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('figures.admin.bulk.errors.row', { defaultValue: 'Row' })}</TableHead>
                        <TableHead>{t('figures.admin.bulk.errors.id', { defaultValue: 'ID' })}</TableHead>
                        <TableHead>{t('figures.admin.bulk.errors.name', { defaultValue: 'Name' })}</TableHead>
                        <TableHead>{t('figures.admin.bulk.errors.reason', { defaultValue: 'Reason' })}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importResult.errors.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className='py-6 text-center text-gray-500'>
                            {t('figures.admin.bulk.noErrors', {
                              defaultValue: 'No row errors.',
                            })}
                          </TableCell>
                        </TableRow>
                      ) : (
                        importResult.errors.map(rowError => (
                          <TableRow key={`${rowError.row_number}-${rowError.figure_id ?? 'na'}`}>
                            <TableCell>{rowError.row_number}</TableCell>
                            <TableCell>{rowError.figure_id ?? '-'}</TableCell>
                            <TableCell>{rowError.name ?? '-'}</TableCell>
                            <TableCell>{rowError.reason}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog
        open={formOpen}
        onOpenChange={open => {
          setFormOpen(open);

          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogContent className='flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden p-0'>
          <DialogHeader className='border-b px-6 py-4'>
            <DialogTitle>
              {editingFigure
                ? t('figures.admin.form.editTitle', { defaultValue: 'Edit Figure' })
                : t('figures.admin.form.createTitle', { defaultValue: 'Create Figure' })}
            </DialogTitle>
            <DialogDescription className='sr-only'>
              {t('figures.admin.form.dialogDescription', {
                defaultValue: 'Edit figure fields, images, and prerequisites.',
              })}
            </DialogDescription>
          </DialogHeader>

          <div className='flex-1 overflow-y-auto px-6 py-4'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div className='space-y-2 md:col-span-2'>
                <Label htmlFor='figure-name'>{t('figures.admin.form.name', { defaultValue: 'Name' })}</Label>
                <Input
                  id='figure-name'
                  value={formState.name}
                  onChange={event => setFormState(prev => ({ ...prev, name: event.target.value }))}
                />
              </div>

              <div className='space-y-2 md:col-span-2'>
                <Label htmlFor='figure-description'>
                  {t('figures.admin.form.description', { defaultValue: 'Description' })}
                </Label>
                <Textarea
                  id='figure-description'
                  rows={4}
                  value={formState.description}
                  onChange={event => setFormState(prev => ({ ...prev, description: event.target.value }))}
                />
              </div>

              <div className='space-y-2'>
                <Label>{t('figures.admin.form.difficulty', { defaultValue: 'Difficulty' })}</Label>
                <Select
                  value={formState.difficulty}
                  onValueChange={value =>
                    setFormState(prev => ({
                      ...prev,
                      difficulty: value as FigureFormState['difficulty'],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='basic'>basic</SelectItem>
                    <SelectItem value='intermediate'>intermediate</SelectItem>
                    <SelectItem value='intermediate-advance'>intermediate-advance</SelectItem>
                    <SelectItem value='advance'>advance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label>{t('figures.admin.form.type', { defaultValue: 'Type' })}</Label>
                <Select
                  value={formState.type}
                  onValueChange={value =>
                    setFormState(prev => ({
                      ...prev,
                      type: value as FigureFormState['type'],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='spins'>spins</SelectItem>
                    <SelectItem value='climbs'>climbs</SelectItem>
                    <SelectItem value='inverts'>inverts</SelectItem>
                    <SelectItem value='flexibility'>flexibility</SelectItem>
                    <SelectItem value='strength'>strength</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='figure-ipsf'>{t('figures.admin.form.ipsf', { defaultValue: 'IPSF Code' })}</Label>
                <Input
                  id='figure-ipsf'
                  value={formState.ipsf_code}
                  onChange={event => setFormState(prev => ({ ...prev, ipsf_code: event.target.value }))}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='figure-aliases'>{t('figures.admin.form.aliases', { defaultValue: 'Aliases' })}</Label>
                <Input
                  id='figure-aliases'
                  value={formState.aliases}
                  onChange={event => setFormState(prev => ({ ...prev, aliases: event.target.value }))}
                />
              </div>

              <div className='space-y-2 md:col-span-2'>
                <Label>{t('figures.admin.form.images', { defaultValue: 'Images' })}</Label>
                {editingFigure ? (
                  <>
                    <p className='text-xs text-gray-500'>
                      {t('figures.admin.form.imagesHelp', {
                        defaultValue: 'Upload one or more images. Remove any image to replace it.',
                      })}
                    </p>
                    <Input
                      type='file'
                      accept={PaymentProofContentTypesList.join(',')}
                      disabled={isUploadingImage || isRemovingImage}
                      onChange={event => {
                        const file = event.target.files?.[0];

                        if (!file) {
                          return;
                        }

                        void handleImageUpload(file).finally(() => {
                          event.target.value = '';
                        });
                      }}
                    />
                    <div className='grid grid-cols-2 gap-3 md:grid-cols-3'>
                      {(editingFigure.images && editingFigure.images.length > 0
                        ? editingFigure.images
                        : editingFigure.image_url
                          ? [
                              {
                                id: -1,
                                file_key: editingFigure.image_url,
                                url: editingFigure.image_url,
                                created_at: '',
                              },
                            ]
                          : []
                      ).map(image => (
                        <div key={`${image.id}-${image.file_key}`} className='space-y-2 rounded-md border p-2'>
                          <img
                            src={image.url}
                            alt={t('figures.admin.form.imageAlt', { defaultValue: 'Figure image' })}
                            className='h-28 w-full rounded object-cover'
                          />
                          <Button
                            type='button'
                            size='sm'
                            variant='destructive'
                            className='w-full'
                            disabled={isRemovingImage}
                            onClick={() => {
                              void handleImageRemove(image.file_key);
                            }}
                          >
                            {t('figures.admin.form.removeImage', { defaultValue: 'Remove' })}
                          </Button>
                        </div>
                      ))}
                      {!editingFigure.images?.length && !editingFigure.image_url ? (
                        <div className='col-span-full rounded-md border border-dashed p-3 text-sm text-gray-500'>
                          {t('figures.admin.form.noImages', { defaultValue: 'No images uploaded yet.' })}
                        </div>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <p className='text-xs text-gray-500'>
                    {t('figures.admin.form.imagesCreateHint', {
                      defaultValue: 'Create the figure first, then edit it to upload images.',
                    })}
                  </p>
                )}
              </div>

              <div className='space-y-2 md:col-span-2'>
                <Label>{t('figures.admin.form.prerequisites', { defaultValue: 'Prerequisites' })}</Label>
                <p className='text-xs text-gray-500'>
                  {t('figures.admin.form.prerequisitesHelp', {
                    defaultValue: 'Select prerequisite figures required before this figure.',
                  })}
                </p>
                <Input
                  id='figure-prerequisites-search'
                  value={prerequisiteSearch}
                  onChange={event => setPrerequisiteSearch(event.target.value)}
                  placeholder={t('figures.admin.form.prerequisitesSearchPlaceholder', {
                    defaultValue: 'Filter by name or IPSF code',
                  })}
                />
                <div className='max-h-44 space-y-2 overflow-y-auto rounded-md border px-3 py-2'>
                  {prerequisiteOptions.length === 0 ? (
                    <p className='text-sm text-gray-500'>
                      {t('figures.admin.form.noPrerequisitesOptions', {
                        defaultValue: 'No figures available to assign as prerequisites.',
                      })}
                    </p>
                  ) : filteredPrerequisiteOptions.length === 0 ? (
                    <p className='text-sm text-gray-500'>
                      {t('figures.admin.form.noPrerequisitesMatches', {
                        defaultValue: 'No prerequisite matches your filter.',
                      })}
                    </p>
                  ) : (
                    filteredPrerequisiteOptions.map(figure => {
                      const checked = formState.prerequisites_ids.includes(figure.id);

                      return (
                        <label
                          key={figure.id}
                          htmlFor={`figure-prerequisite-${figure.id}`}
                          className='flex cursor-pointer items-center justify-between gap-3 rounded-sm px-1 py-1 hover:bg-gray-50'
                        >
                          <span className='min-w-0 text-sm text-gray-800'>{figure.name}</span>
                          <div className='flex items-center gap-3'>
                            <span className='text-xs text-gray-500'>{figure.ipsf_code ?? '-'}</span>
                            <Checkbox
                              id={`figure-prerequisite-${figure.id}`}
                              checked={checked}
                              onCheckedChange={value => togglePrerequisite(figure.id, value === true)}
                            />
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
                {editingFigure && !prerequisitesDirty ? (
                  <p className='text-xs text-gray-500'>
                    {t('figures.admin.form.prerequisitesEditHint', {
                      defaultValue:
                        'Changing prerequisites here will replace existing prerequisite links for this figure.',
                    })}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className='border-t px-6 py-4'>
            <div className='flex justify-end gap-2'>
              <Button
                variant='outline'
                onClick={() => {
                  setFormOpen(false);
                  resetForm();
                }}
              >
                {t('common.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting || !formState.name.trim()}>
                {editingFigure
                  ? t('common.save', { defaultValue: 'Save' })
                  : t('common.create', { defaultValue: 'Create' })}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(figureToDelete)}
        onOpenChange={open => {
          if (!open) {
            setFigureToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        title={t('figures.admin.deleteTitle', { defaultValue: 'Delete Figure' })}
        description={t('figures.admin.confirmDelete', {
          defaultValue: 'Delete figure "{{name}}"?',
          name: figureToDelete?.name ?? '',
        })}
        confirmLabel={t('common.delete', { defaultValue: 'Delete' })}
        cancelLabel={t('common.cancel', { defaultValue: 'Cancel' })}
        confirmVariant='destructive'
        isLoading={isDeleting}
      />
    </div>
  );
}

export const SecureAdminFiguresPage = SecurityGuard(AdminFiguresPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled, FEATURE_FLAG.isAdminFiguresPageEnabled],
  orPermissions: AdminPermissions.figures,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
