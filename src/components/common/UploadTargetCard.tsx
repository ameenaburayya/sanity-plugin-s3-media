import { Card } from '@sanity/ui';
import { styled } from 'styled-components';

// import { withFocusRing } from '../../../../components/withFocusRing';
import { uploadTarget } from './UploadTarget';

const StyledCard = styled(Card)`
  height: 100%;
`;

export const UploadTargetCard = uploadTarget(StyledCard);
