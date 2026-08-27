import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CampaignModal } from './campaign-modal';
import { CampaignResponsesDialog } from './campaign-responses-dialog';

import { SpinnerLoader } from '@components/loaders';
import { ConfirmDialog } from '@components/modals';
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui';
import { type Campaign, DansshipAPI } from '@core/api';
import { useCampaigns, usePromise } from '@hooks';

export function CampaignsPanel() {
  const { t } = useTranslation();
  const {
    campaigns,
    structuredTypes,
    isLoading,
    createCampaign,
    updateCampaign,
    deactivateCampaign,
    reactivateCampaign,
    isCreating,
    isUpdating,
    isDeactivating,
    isReactivating,
  } = useCampaigns();
  const { response: instructorsResponse } = usePromise(() => DansshipAPI.instructorsAdmin.getInstructors());
  const { response: classesResponse } = usePromise(() => DansshipAPI.inventoryAdmin.getClasses());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignToDeactivate, setCampaignToDeactivate] = useState<Campaign | null>(null);
  const [responsesCampaign, setResponsesCampaign] = useState<Campaign | null>(null);

  const instructors = (instructorsResponse?.data ?? [])
    .filter(instructor => Boolean(instructor.id))
    .map(instructor => ({
      id: instructor.id as string,
      label: instructor.full_name || instructor.email,
    }));
  const classes = (classesResponse?.data ?? []).map(classDefinition => ({
    id: classDefinition.id,
    name: classDefinition.name,
  }));

  const handleOpenModal = (campaign?: Campaign) => {
    setSelectedCampaign(campaign ?? null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCampaign(null);
  };

  const handleSubmit = async (payload: Parameters<typeof createCampaign>[0]) => {
    if (selectedCampaign) {
      const { title, description, questions, audience, valid_from, valid_until } = payload;

      return updateCampaign(selectedCampaign.id, {
        title,
        description,
        questions,
        audience,
        valid_from,
        valid_until,
      });
    }

    return createCampaign(payload);
  };

  if (isLoading) {
    return (
      <div className='py-8 flex justify-center'>
        <SpinnerLoader />
      </div>
    );
  }

  const sortedCampaigns = [...campaigns].sort((left, right) => Number(right.is_active) - Number(left.is_active));

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h2 className='text-xl font-semibold'>{t('campaigns:admin.title')}</h2>
        <Button onClick={() => handleOpenModal()}>{t('campaigns:admin.create')}</Button>
      </div>
      {sortedCampaigns.length === 0 ? (
        <p className='text-sm text-gray-500'>{t('campaigns:admin.empty')}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('campaigns:admin.columns.title')}</TableHead>
              <TableHead>{t('campaigns:admin.columns.kind')}</TableHead>
              <TableHead>{t('campaigns:admin.columns.audience')}</TableHead>
              <TableHead>{t('campaigns:admin.columns.responses')}</TableHead>
              <TableHead>{t('common:status')}</TableHead>
              <TableHead>{t('common:actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCampaigns.map(campaign => (
              <TableRow
                key={campaign.id}
                className={!campaign.is_active ? 'opacity-60 grayscale blur-[0.5px]' : undefined}
              >
                <TableCell className='font-medium'>{campaign.title}</TableCell>
                <TableCell>{t(`campaigns:admin.kind.${campaign.kind}`)}</TableCell>
                <TableCell>{t(`campaigns:admin.planStatus.${campaign.audience.plan_status}`)}</TableCell>
                <TableCell>
                  <Button variant='ghost' size='sm' className='px-0' onClick={() => setResponsesCampaign(campaign)}>
                    {t('campaigns:admin.viewResponses')} ({campaign.response_count})
                  </Button>
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${campaign.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  >
                    {campaign.is_active ? t('common:active') : t('common:inactive')}
                  </span>
                </TableCell>
                <TableCell className='flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleOpenModal(campaign)}
                    disabled={!campaign.is_active}
                  >
                    {t('common:edit')}
                  </Button>
                  {campaign.is_active ? (
                    <Button variant='outline' size='sm' onClick={() => setCampaignToDeactivate(campaign)}>
                      {t('common:deactivate')}
                    </Button>
                  ) : (
                    <Button
                      variant='outline'
                      size='sm'
                      disabled={isReactivating}
                      onClick={() => void reactivateCampaign(campaign.id)}
                    >
                      {t('common:reactivate')}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <CampaignModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        initialData={selectedCampaign}
        isLoading={isCreating || isUpdating}
        structuredTypes={structuredTypes}
        instructors={instructors}
        classes={classes}
      />
      <CampaignResponsesDialog
        campaign={responsesCampaign}
        open={Boolean(responsesCampaign)}
        onOpenChange={open => {
          if (!open) {
            setResponsesCampaign(null);
          }
        }}
      />
      <ConfirmDialog
        open={Boolean(campaignToDeactivate)}
        onOpenChange={open => {
          if (!open) {
            setCampaignToDeactivate(null);
          }
        }}
        title={t('campaigns:admin.deactivateTitle')}
        description={t('campaigns:admin.deactivateConfirm')}
        confirmLabel={t('common:deactivate')}
        isLoading={isDeactivating}
        onConfirm={async () => {
          if (!campaignToDeactivate) {
            return;
          }

          await deactivateCampaign(campaignToDeactivate.id);
          setCampaignToDeactivate(null);
        }}
      />
    </div>
  );
}
