import {
  Accordion,
  AccordionTitleProps,
  ButtonProps,
  Flag,
  Form,
  Icon,
  Popup,
} from 'semantic-ui-react';
import React from 'react';
import { useState } from 'react';
import { parseFlagName } from '../modules/member';
import { makeDropdownOption } from '../utils';
import {
  CommitteeID,
  pushTemplateMembers,
  Template,
  TEMPLATE_TO_MEMBERS,
} from '../models/committee';

export function TemplatePreview(props: { template?: Template }) {
  if (!props.template) {
    return <p>Select a template to see which members will be added</p>;
  }

  return (
    <>
      {TEMPLATE_TO_MEMBERS[props.template].map((member) => (
        <div key={member.name}>
          <Flag name={parseFlagName(member.name)} />
          {member.name}
        </div>
      ))}
    </>
  );
}

export function TemplateAdder(props: { committeeID: CommitteeID }) {
  const [template, setTemplate] = useState<Template | undefined>(undefined);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const openAccordion = (event: React.MouseEvent<HTMLDivElement>, data: AccordionTitleProps) => {
    const newIndex = activeIndex === (data.index as number) ? -1 : (data.index as number);

    setActiveIndex(newIndex);
  };

  const pushTemplate = (event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) => {
    event.preventDefault();

    if (template) {
      // Add countries as per selected templates
      pushTemplateMembers(props.committeeID, template);
    }
  };

  return (
    <Accordion>
      <Accordion.Title active={activeIndex === 0} index={0} onClick={openAccordion}>
        <Icon name="dropdown" />
        Add members from a template (e.g. G20)
      </Accordion.Title>
      <Accordion.Content active={activeIndex === 0}>
        <Form>
          <Form.Dropdown
            label="Template"
            name="template"
            search
            clearable
            fluid
            selection
            placeholder="Select a template to add"
            value={template}
            options={Object.values(Template).map(makeDropdownOption)}
            onChange={(event, data) => setTemplate(data.value as Template)}
          />
          <Popup
            basic
            hoverable
            position="bottom left"
            trigger={
              <Form.Button icon="plus" disabled={!template} primary basic onClick={pushTemplate} />
            }
          >
            <Popup.Content>
              <TemplatePreview template={template} />
            </Popup.Content>
          </Popup>
        </Form>
      </Accordion.Content>
    </Accordion>
  );
}
