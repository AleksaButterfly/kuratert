import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Field } from 'react-final-form';

import ListingImage from './ListingImage';
import css from './EditListingPhotosForm.module.css';

const SortableListingImage = props => {
  const { id, name, onRemoveImage, intl, aspectWidth, aspectHeight, variantPrefix } = props;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
    touchAction: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Field name={name}>
        {fieldProps => {
          const image = fieldProps.input.value;
          return image ? (
            <ListingImage
              image={image}
              className={css.thumbnail}
              savedImageAltText={intl.formatMessage({
                id: 'EditListingPhotosForm.savedImageAltText',
              })}
              onRemoveImage={() => onRemoveImage(image?.id)}
              aspectWidth={aspectWidth}
              aspectHeight={aspectHeight}
              variantPrefix={variantPrefix}
            />
          ) : null;
        }}
      </Field>
    </div>
  );
};

export default SortableListingImage;
